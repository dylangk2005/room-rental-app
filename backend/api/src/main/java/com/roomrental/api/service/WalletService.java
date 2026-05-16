package com.roomrental.api.service;

import com.roomrental.api.dto.response.wallet.WalletBalanceResponse;
import com.roomrental.api.dto.response.wallet.WalletTransactionPageResponse;

public interface WalletService {
    WalletBalanceResponse getBalance(Integer userId);

    WalletTransactionPageResponse getTransactions(Integer userId, int page, int size);
}
