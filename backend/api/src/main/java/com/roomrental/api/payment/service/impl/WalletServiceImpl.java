package com.roomrental.api.payment.service.impl;

import com.roomrental.api.admin.entity.AuditLog;
import com.roomrental.api.admin.service.AuditLogService;
import com.roomrental.api.common.exception.AppException;
import com.roomrental.api.integration.service.VnPayService;
import com.roomrental.api.notification.entity.Notification;
import com.roomrental.api.notification.service.NotificationService;
import com.roomrental.api.payment.dto.response.DepositInitResponse;
import com.roomrental.api.payment.dto.request.DepositRequest;
import com.roomrental.api.payment.dto.response.WalletBalanceResponse;
import com.roomrental.api.payment.dto.response.WalletTransactionPageResponse;
import com.roomrental.api.payment.dto.response.WalletTransactionResponse;
import com.roomrental.api.payment.entity.Deposit;
import com.roomrental.api.payment.entity.Payment;
import com.roomrental.api.payment.repository.DepositRepository;
import com.roomrental.api.payment.repository.PaymentRepository;
import com.roomrental.api.payment.service.WalletService;
import com.roomrental.api.post.entity.Post.PostStatus;
import com.roomrental.api.post.entity.Post;
import com.roomrental.api.user.entity.User;
import com.roomrental.api.user.repository.UserRepository;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class WalletServiceImpl implements WalletService {

    private static final long DEPOSIT_PAYMENT_TIMEOUT_MINUTES = 15;

    private final UserRepository userRepository;
    private final DepositRepository depositRepository;
    private final PaymentRepository paymentRepository;
    private final VnPayService vnPayService;
    private final NotificationService notificationService;
    private final AuditLogService auditLogService;

    @Override
    public WalletBalanceResponse getBalance(Integer userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> AppException.notFound("Không tìm thấy người dùng"));

        return WalletBalanceResponse.builder()
                .balance(nullSafe(user.getAccountBalance()))
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public WalletTransactionPageResponse getTransactions(Integer userId, int page, int size, String type) {
        Pageable pageable = PageRequest.of(
                page,
                size,
                Sort.by(Sort.Order.desc("createdAt"))
        );

        String normalizedType = type != null ? type.trim().toUpperCase() : "";

        if ("DEPOSIT".equals(normalizedType)) {
            Page<Deposit> deposits = depositRepository.findByUserId(userId, pageable);

            return WalletTransactionPageResponse.builder()
                    .transactions(deposits.getContent().stream().map(this::mapDeposit).toList())
                    .currentPage(deposits.getNumber())
                    .totalPages(deposits.getTotalPages())
                    .totalElements(deposits.getTotalElements())
                    .build();
        }

        if ("PAYMENT".equals(normalizedType)) {
            Page<Payment> payments = paymentRepository.findByUserId(userId, pageable);

            return WalletTransactionPageResponse.builder()
                    .transactions(payments.getContent().stream().map(this::mapPayment).toList())
                    .currentPage(payments.getNumber())
                    .totalPages(payments.getTotalPages())
                    .totalElements(payments.getTotalElements())
                    .build();
        }

        if (!normalizedType.isBlank()) {
            throw AppException.badRequest("Loại lịch sử giao dịch không hợp lệ");
        }

        Page<Deposit> deposits = depositRepository.findByUserId(userId, pageable);
        Page<Payment> payments = paymentRepository.findByUserId(userId, pageable);

        List<WalletTransactionResponse> merged = new ArrayList<>();

        merged.addAll(deposits.getContent()
                .stream()
                .map(this::mapDeposit)
                .toList());

        merged.addAll(payments.getContent()
                .stream()
                .map(this::mapPayment)
                .toList());

        List<WalletTransactionResponse> sorted = merged.stream()
                .sorted(Comparator.comparing(WalletTransactionResponse::getCreatedAt).reversed())
                .limit(size)
                .toList();

        return WalletTransactionPageResponse.builder()
                .transactions(sorted)
                .currentPage(page)
                .totalPages(Math.max(deposits.getTotalPages(), payments.getTotalPages()))
                .totalElements(deposits.getTotalElements() + payments.getTotalElements())
                .build();
    }

    @Override
    @Transactional
    public DepositInitResponse initDeposit(Integer userId, DepositRequest request, String clientIp) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> AppException.notFound("Không tìm thấy người dùng"));

        BigDecimal amount = request.getAmount();

        if (amount == null || amount.compareTo(BigDecimal.valueOf(10000)) < 0) {
            throw AppException.badRequest("Số tiền nạp tối thiểu là 10.000đ");
        }

        Deposit deposit = new Deposit();
        deposit.setUser(user);
        deposit.setAmount(amount);
        deposit.setTax(BigDecimal.ZERO);
        deposit.setNetAmount(amount);
        deposit.setMethod(Deposit.DepositMethod.VNPAY);
        deposit.setStatus(Deposit.DepositStatus.PENDING);
        deposit.setTransactionRef(generateTransactionRef());
        deposit.setNote("Khởi tạo giao dịch nạp tiền qua VNPAY");
        deposit.setCreatedAt(LocalDateTime.now());

        Deposit saved = depositRepository.save(deposit);

        auditLogService.log(
                user.getId(),
                "DEPOSIT_INIT",
                AuditLog.TargetType.DEPOSIT,
                saved.getId(),
                "Người dùng #" + user.getId()
                        + " khởi tạo giao dịch nạp tiền qua VNPAY. "
                        + "Số tiền: " + saved.getAmount()
                        + "đ. Mã giao dịch: " + saved.getTransactionRef()
                        + ". IP client: " + clientIp + "."
        );

        String paymentUrl = vnPayService.createPaymentUrl(
                saved.getTransactionRef(),
                saved.getAmount(),
                clientIp
        );

        return DepositInitResponse.builder()
                .depositId(saved.getId())
                .amount(saved.getAmount())
                .transactionRef(saved.getTransactionRef())
                .paymentUrl(paymentUrl)
                .build();
    }

    @Override
    @Transactional
    public void handleVnPayCallback(Map<String, String> params) {
        if (!vnPayService.verifySignature(params)) {
            throw AppException.badRequest("Chữ ký VNPAY không hợp lệ");
        }

        String transactionRef = params.get("vnp_TxnRef");
        String responseCode = params.get("vnp_ResponseCode");
        String transactionStatus = params.get("vnp_TransactionStatus");
        String gatewayTransactionNo = params.get("vnp_TransactionNo");
        String vnpAmount = params.get("vnp_Amount");

        if (transactionRef == null || transactionRef.isBlank()) {
            throw AppException.badRequest("Thiếu mã giao dịch VNPAY");
        }

        Deposit deposit = depositRepository.findByTransactionRefForUpdate(transactionRef)
                .orElseThrow(() -> AppException.notFound("Không tìm thấy giao dịch nạp tiền"));

        if (deposit.getStatus() != Deposit.DepositStatus.PENDING) {
            return;
        }

        if (isDepositExpired(deposit)) {
            deposit.setStatus(Deposit.DepositStatus.CANCELLED);
            deposit.setGatewayTransactionNo(gatewayTransactionNo);
            deposit.setNote("Giao dịch nạp tiền đã hủy do quá thời hạn thanh toán VNPAY");
            return;
        }

        BigDecimal callbackAmount = new BigDecimal(vnpAmount)
                .divide(BigDecimal.valueOf(100));

        if (deposit.getAmount().compareTo(callbackAmount) != 0) {
            deposit.setStatus(Deposit.DepositStatus.FAILED);
            deposit.setGatewayTransactionNo(gatewayTransactionNo);
            deposit.setNote("Nạp tiền thất bại: số tiền callback không khớp");

            auditLogService.log(
                    deposit.getUser().getId(),
                    "DEPOSIT_FAILED",
                    AuditLog.TargetType.DEPOSIT,
                    deposit.getId(),
                    "Nạp tiền thất bại do số tiền callback không khớp. "
                            + "Mã giao dịch: " + deposit.getTransactionRef()
                            + ". Số tiền yêu cầu: " + deposit.getAmount()
                            + "đ. Số tiền callback: " + callbackAmount
                            + "đ. Gateway transaction no: " + gatewayTransactionNo + "."
            );

            return;
        }

        boolean success = "00".equals(responseCode) && "00".equals(transactionStatus);

        if (!success) {
            deposit.setStatus(Deposit.DepositStatus.FAILED);
            deposit.setGatewayTransactionNo(gatewayTransactionNo);
            deposit.setNote("Nạp tiền thất bại, mã phản hồi VNPAY: " + responseCode);

            auditLogService.log(
                    deposit.getUser().getId(),
                    "DEPOSIT_FAILED",
                    AuditLog.TargetType.DEPOSIT,
                    deposit.getId(),
                    "Nạp tiền thất bại do VNPAY trả về trạng thái không thành công. "
                            + "Mã giao dịch: " + deposit.getTransactionRef()
                            + ". Response code: " + responseCode
                            + ". Transaction status: " + transactionStatus
                            + ". Gateway transaction no: " + gatewayTransactionNo + "."
            );

            return;
        }

        User user = deposit.getUser();

        BigDecimal openingBalance = nullSafe(user.getAccountBalance());
        BigDecimal closingBalance = openingBalance.add(deposit.getNetAmount());

        user.setAccountBalance(closingBalance);

        deposit.setStatus(Deposit.DepositStatus.SUCCESS);
        deposit.setGatewayTransactionNo(gatewayTransactionNo);
        deposit.setOpeningBalance(openingBalance);
        deposit.setClosingBalance(closingBalance);
        deposit.setNote("Nạp tiền qua VNPAY thành công");

        notificationService.notifyUser(
                user.getId(),
                Notification.NotificationType.SYSTEM_INFORMATION,
                "Nạp tiền thành công qua VNPAY. Số tiền nạp: "
                        + deposit.getNetAmount()
                        + "đ. Số dư trước giao dịch: "
                        + openingBalance
                        + "đ. Số dư hiện tại: "
                        + closingBalance
                        + "đ. Mã giao dịch: "
                        + deposit.getTransactionRef()
                        + "."
        );

        auditLogService.log(
                user.getId(),
                "DEPOSIT_SUCCESS",
                AuditLog.TargetType.DEPOSIT,
                deposit.getId(),
                "Nạp tiền thành công qua VNPAY. "
                        + "Người dùng #" + user.getId()
                        + ". Số tiền nạp: " + deposit.getNetAmount()
                        + "đ. Số dư trước: " + openingBalance
                        + "đ. Số dư sau: " + closingBalance
                        + "đ. Mã giao dịch: " + deposit.getTransactionRef()
                        + ". Gateway transaction no: " + gatewayTransactionNo + "."
        );

    }

    private String generateTransactionRef() {
        return "DEP-" + System.currentTimeMillis() + "-" +
                UUID.randomUUID().toString().substring(0, 8).toUpperCase();
    }

    private void cancelExpiredPendingDeposits(List<Deposit> deposits) {
        List<Deposit> expiredDeposits = deposits.stream()
                .filter(this::isDepositExpired)
                .toList();

        if (expiredDeposits.isEmpty()) {
            return;
        }

        expiredDeposits.forEach(deposit -> {
            deposit.setStatus(Deposit.DepositStatus.CANCELLED);
            deposit.setNote("Giao dịch nạp tiền đã hủy do quá thời hạn thanh toán VNPAY");
        });

        depositRepository.saveAll(expiredDeposits);
    }

    private boolean isDepositExpired(Deposit deposit) {
        return deposit.getStatus() == Deposit.DepositStatus.PENDING
                && deposit.getCreatedAt() != null
                && deposit.getCreatedAt().plusMinutes(DEPOSIT_PAYMENT_TIMEOUT_MINUTES).isBefore(LocalDateTime.now());
    }

    private WalletTransactionResponse mapDeposit(Deposit deposit) {
        boolean expiredPending = isDepositExpired(deposit);

        return WalletTransactionResponse.builder()
                .id(deposit.getId())
                .transactionType("DEPOSIT")
                .status(expiredPending ? Deposit.DepositStatus.CANCELLED.name() : deposit.getStatus().name())
                .amount(nullSafe(deposit.getNetAmount()))
                .openingBalance(deposit.getOpeningBalance())
                .closingBalance(deposit.getClosingBalance())
                .description(expiredPending ? "Giao dịch nạp tiền đã quá hạn thanh toán VNPAY" : deposit.getNote())
                .createdAt(deposit.getCreatedAt())
                .build();
    }

    private WalletTransactionResponse mapPayment(Payment payment) {
        Post post = payment.getPost();
        boolean isRefund = payment.getPaymentType() == Payment.PaymentType.REFUND;

        return WalletTransactionResponse.builder()
                .id(payment.getId())
                .transactionType(payment.getPaymentType().name())
                .status("SUCCESS")
                .amount(isRefund ? nullSafe(payment.getFinalFee()) : nullSafe(payment.getFinalFee()).negate())
                .openingBalance(payment.getOpeningBalance())
                .closingBalance(payment.getClosingBalance())
                .description(buildPaymentDescription(payment))
                .postId(post != null ? post.getId() : null)
                .postTitle(post != null ? post.getTitle() : null)
                .postStatus(post != null && post.getStatus() != null ? post.getStatus().name() : null)
                .createdAt(payment.getCreatedAt())
                .build();
    }

    private String buildPaymentDescription(Payment payment) {
        if (payment.getPaymentType() == null) {
            return "Thanh toán dịch vụ";
        }

        return switch (payment.getPaymentType()) {
            case POST_PAYMENT -> "Thanh toán đăng tin";
            case EXTEND -> "Thanh toán gia hạn tin";
            case PUSH -> "Thanh toán đẩy tin";
            case REFUND -> "Hoàn tiền do tin bị từ chối";
        };
    }

    private BigDecimal nullSafe(BigDecimal value) {
        return value != null ? value : BigDecimal.ZERO;
    }
}