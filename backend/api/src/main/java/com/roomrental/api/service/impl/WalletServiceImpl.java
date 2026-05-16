package com.roomrental.api.service.impl;

import com.roomrental.api.dto.response.wallet.WalletBalanceResponse;
import com.roomrental.api.dto.response.wallet.WalletTransactionPageResponse;
import com.roomrental.api.dto.response.wallet.WalletTransactionResponse;
import com.roomrental.api.entity.Deposit;
import com.roomrental.api.entity.Payment;
import com.roomrental.api.entity.User;
import com.roomrental.api.exception.AppException;
import com.roomrental.api.repository.DepositRepository;
import com.roomrental.api.repository.PaymentRepository;
import com.roomrental.api.repository.UserRepository;
import com.roomrental.api.service.WalletService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

@Service
@RequiredArgsConstructor
public class WalletServiceImpl implements WalletService {

    private final UserRepository userRepository;
    private final DepositRepository depositRepository;
    private final PaymentRepository paymentRepository;

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
