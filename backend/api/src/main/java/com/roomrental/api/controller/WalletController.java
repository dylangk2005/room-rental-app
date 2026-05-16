package com.roomrental.api.controller;

import com.roomrental.api.dto.response.common.ApiResponse;
import com.roomrental.api.dto.response.wallet.WalletBalanceResponse;
import com.roomrental.api.dto.response.wallet.WalletTransactionPageResponse;
import com.roomrental.api.service.WalletService;
import com.roomrental.api.util.AuthHelper;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/wallet")
@RequiredArgsConstructor
public class WalletController {

    private final WalletService walletService;
    private final AuthHelper authHelper;

    @GetMapping("/balance")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<WalletBalanceResponse>> getBalance() {
        WalletBalanceResponse response = walletService.getBalance(
                authHelper.getCurrentUserId()
        );

        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/transactions")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<WalletTransactionPageResponse>> getTransactions(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        WalletTransactionPageResponse response = walletService.getTransactions(
                authHelper.getCurrentUserId(),
                page,
                size
        );

        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
