package com.roomrental.api.controller;

import com.roomrental.api.dto.request.wallet.DepositRequest;
import com.roomrental.api.dto.response.common.ApiResponse;
import com.roomrental.api.dto.response.wallet.DepositInitResponse;
import com.roomrental.api.dto.response.wallet.WalletBalanceResponse;
import com.roomrental.api.dto.response.wallet.WalletTransactionPageResponse;
import com.roomrental.api.service.WalletService;
import com.roomrental.api.util.AuthHelper;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

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

    @PostMapping("/deposit")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<DepositInitResponse>> initDeposit(
            @Valid @RequestBody DepositRequest request,
            HttpServletRequest httpServletRequest
    ) {
        DepositInitResponse response = walletService.initDeposit(
                authHelper.getCurrentUserId(),
                request,
                getClientIp(httpServletRequest)
        );

        return ResponseEntity.ok(ApiResponse.success(
                "Khởi tạo giao dịch nạp tiền thành công",
                response
        ));
    }
    private String getClientIp(HttpServletRequest request) {
        String forwardedFor = request.getHeader("X-Forwarded-For");

        if (forwardedFor != null && !forwardedFor.isBlank()) {
            return forwardedFor.split(",")[0].trim();
        }

        return request.getRemoteAddr();
    }

    @PostMapping("/deposit/callback")
    public ResponseEntity<ApiResponse<Void>> handleVnPayCallback(
            @RequestParam Map<String, String> params
    ) {
        walletService.handleVnPayCallback(params);

        return ResponseEntity.ok(ApiResponse.success(
                "Xử lý callback VNPAY thành công",
                null
        ));
    }

    @GetMapping("/deposit/callback")
    public ResponseEntity<ApiResponse<Void>> handleVnPayCallbackGet(
            @RequestParam Map<String, String> params
    ) {
        walletService.handleVnPayCallback(params);

        return ResponseEntity.ok(ApiResponse.success(
                "Xử lý callback VNPAY thành công",
                null
        ));
    }
}
