package com.roomrental.api.service;

import com.roomrental.api.dto.request.wallet.DepositRequest;
import com.roomrental.api.dto.response.wallet.DepositInitResponse;
import com.roomrental.api.dto.response.wallet.WalletBalanceResponse;
import com.roomrental.api.dto.response.wallet.WalletTransactionPageResponse;

import java.util.Map;

public interface WalletService {
    WalletBalanceResponse getBalance(Integer userId);

    WalletTransactionPageResponse getTransactions(Integer userId, int page, int size);

    DepositInitResponse initDeposit(Integer userId, DepositRequest request, String clientIp);

    void handleVnPayCallback(Map<String, String> params);
}
