package com.roomrental.api.payment.controller;

import com.roomrental.api.common.dto.ApiResponse;
import com.roomrental.api.common.util.AuthHelper;
import com.roomrental.api.payment.dto.DepositInitResponse;
import com.roomrental.api.payment.dto.DepositRequest;
import com.roomrental.api.payment.dto.WalletBalanceResponse;
import com.roomrental.api.payment.dto.WalletTransactionPageResponse;
import com.roomrental.api.payment.entity.Deposit;
import com.roomrental.api.payment.entity.Payment;
import com.roomrental.api.payment.service.WalletService;
import com.roomrental.api.user.entity.User;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.util.UriComponentsBuilder;

@RestController
@RequestMapping("/api/wallet")
@RequiredArgsConstructor
public class WalletController {

    private final WalletService walletService;
    private final AuthHelper authHelper;

    @Value("${frontend.url:http://localhost:5173}")
    private String frontendUrl;

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
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String type
    ) {
        WalletTransactionPageResponse response = walletService.getTransactions(
                authHelper.getCurrentUserId(),
                page,
                size,
                type
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
    public ResponseEntity<Void> handleVnPayCallbackGet(
            @RequestParam Map<String, String> params
    ) {
        String result = "success";

        try {
            walletService.handleVnPayCallback(params);
            if (!"00".equals(params.get("vnp_ResponseCode")) || !"00".equals(params.get("vnp_TransactionStatus"))) {
                result = "failed";
            }
        } catch (RuntimeException ex) {
            result = "failed";
        }

        String redirectUrl = UriComponentsBuilder
                .fromHttpUrl(frontendUrl)
                .path("/user/wallet")
                .queryParam("deposit", result)
                .build()
                .toUriString();

        HttpHeaders headers = new HttpHeaders();
        headers.add(HttpHeaders.LOCATION, redirectUrl);
        return new ResponseEntity<>(headers, HttpStatus.FOUND);
    }
}