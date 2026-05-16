package com.roomrental.api.controller;

import com.roomrental.api.dto.request.payment.BoostPaymentRequest;
import com.roomrental.api.dto.request.payment.PayPostRequest;
import com.roomrental.api.dto.request.payment.RenewPaymentRequest;
import com.roomrental.api.dto.response.common.ApiResponse;
import com.roomrental.api.dto.response.payment.PaymentResponse;
import com.roomrental.api.service.PaymentService;
import com.roomrental.api.util.AuthHelper;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;
    private final AuthHelper authHelper;

    @PostMapping("/post")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<PaymentResponse>> payPost(
            @Valid @RequestBody PayPostRequest request
    ) {
        PaymentResponse response = paymentService.payPost(
                authHelper.getCurrentUserId(),
                request
        );

        return ResponseEntity.ok(ApiResponse.success(
                "Thanh toán đăng tin thành công, tin đang chờ kiểm duyệt",
                response
        ));
    }

    @PostMapping("/renew")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<PaymentResponse>> renewPost(
            @Valid @RequestBody RenewPaymentRequest request
    ) {
        PaymentResponse response = paymentService.renewPost(
                authHelper.getCurrentUserId(),
                request
        );

        return ResponseEntity.ok(ApiResponse.success(
                "Gia hạn tin thành công",
                response
        ));
    }

    @PostMapping("/boost")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<PaymentResponse>> boostPost(
            @Valid @RequestBody BoostPaymentRequest request
    ) {
        PaymentResponse response = paymentService.boostPost(
                authHelper.getCurrentUserId(),
                request
        );

        return ResponseEntity.ok(ApiResponse.success(
                "Đẩy tin thành công",
                response
        ));
    }
}
