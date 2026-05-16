package com.roomrental.api.service.impl;

import com.roomrental.api.dto.request.wallet.DepositRequest;
import com.roomrental.api.dto.response.wallet.DepositInitResponse;
import com.roomrental.api.dto.response.wallet.WalletBalanceResponse;
import com.roomrental.api.dto.response.wallet.WalletTransactionPageResponse;
import com.roomrental.api.dto.response.wallet.WalletTransactionResponse;
import com.roomrental.api.entity.Deposit;
import com.roomrental.api.entity.Notification;
import com.roomrental.api.entity.Payment;
import com.roomrental.api.entity.User;
import com.roomrental.api.exception.AppException;
import com.roomrental.api.repository.DepositRepository;
import com.roomrental.api.repository.PaymentRepository;
import com.roomrental.api.repository.UserRepository;
import com.roomrental.api.service.NotificationService;
import com.roomrental.api.service.VnPayService;
import com.roomrental.api.service.WalletService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
public class WalletServiceImpl implements WalletService {

    private final UserRepository userRepository;
    private final DepositRepository depositRepository;
    private final PaymentRepository paymentRepository;
    private final VnPayService vnPayService;
    private final NotificationService notificationService;

    @Override
    public WalletBalanceResponse getBalance(Integer userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> AppException.notFound("Không tìm thấy người dùng"));

        return WalletBalanceResponse.builder()
                .balance(nullSafe(user.getAccountBalance()))
                .build();
    }

    @Override
    public WalletTransactionPageResponse getTransactions(Integer userId, int page, int size) {
        Pageable pageable = PageRequest.of(
                page,
                size,
                Sort.by(Sort.Order.desc("createdAt"))
        );

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

        BigDecimal callbackAmount = new BigDecimal(vnpAmount)
                .divide(BigDecimal.valueOf(100));

        if (deposit.getAmount().compareTo(callbackAmount) != 0) {
            deposit.setStatus(Deposit.DepositStatus.FAILED);
            deposit.setGatewayTransactionNo(gatewayTransactionNo);
            deposit.setNote("Nạp tiền thất bại: số tiền callback không khớp");
            return;
        }

        boolean success = "00".equals(responseCode) && "00".equals(transactionStatus);

        if (!success) {
            deposit.setStatus(Deposit.DepositStatus.FAILED);
            deposit.setGatewayTransactionNo(gatewayTransactionNo);
            deposit.setNote("Nạp tiền thất bại, mã phản hồi VNPAY: " + responseCode);
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
    }

    private String generateTransactionRef() {
        return "DEP-" + System.currentTimeMillis() + "-" +
                UUID.randomUUID().toString().substring(0, 8).toUpperCase();
    }

    private WalletTransactionResponse mapDeposit(Deposit deposit) {
        return WalletTransactionResponse.builder()
                .id(deposit.getId())
                .transactionType("DEPOSIT")
                .status(deposit.getStatus().name())
                .amount(nullSafe(deposit.getNetAmount()))
                .openingBalance(deposit.getOpeningBalance())
                .closingBalance(deposit.getClosingBalance())
                .description(deposit.getNote())
                .createdAt(deposit.getCreatedAt())
                .build();
    }

    private WalletTransactionResponse mapPayment(Payment payment) {
        return WalletTransactionResponse.builder()
                .id(payment.getId())
                .transactionType(payment.getPaymentType().name())
                .status("SUCCESS")
                .amount(nullSafe(payment.getFinalFee()).negate())
                .openingBalance(payment.getOpeningBalance())
                .closingBalance(payment.getClosingBalance())
                .description(buildPaymentDescription(payment))
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
            case REFUND -> "Hoàn tiền";
        };
    }

    private BigDecimal nullSafe(BigDecimal value) {
        return value != null ? value : BigDecimal.ZERO;
    }
}
