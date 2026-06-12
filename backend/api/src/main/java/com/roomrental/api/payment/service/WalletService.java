package com.roomrental.api.payment.service;

import com.roomrental.api.payment.dto.response.DepositInitResponse;
import com.roomrental.api.payment.dto.request.DepositRequest;
import com.roomrental.api.payment.dto.response.WalletBalanceResponse;
import com.roomrental.api.payment.dto.response.WalletTransactionPageResponse;
import com.roomrental.api.payment.entity.Payment;
import java.util.Map;

public interface WalletService {
    WalletBalanceResponse getBalance(Integer userId);

    WalletTransactionPageResponse getTransactions(Integer userId, int page, int size, String type);

    DepositInitResponse initDeposit(Integer userId, DepositRequest request, String clientIp);

    void handleVnPayCallback(Map<String, String> params);
}