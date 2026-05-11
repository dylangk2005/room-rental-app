package com.roomrental.api.controller;

import com.roomrental.api.dto.request.LoginRequest;
import com.roomrental.api.dto.request.RegisterRequest;
import com.roomrental.api.dto.request.VerifyOtpRequest;
import com.roomrental.api.dto.response.ApiResponse;
import com.roomrental.api.dto.response.UserResponse;
import com.roomrental.api.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {
    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<Void>> register(
            @Valid @RequestBody RegisterRequest request) {
        authService.register(request);
        return ResponseEntity.ok(
                ApiResponse.success("Đăng ký thành công, vui lòng kiểm tra email để xác thực OTP", null));
    }

    @PostMapping("/verify-otp")
    public ResponseEntity<ApiResponse<Void>> verifyOtp(
            @Valid @RequestBody VerifyOtpRequest request) {
        authService.verifyOtp(request);
        return ResponseEntity.ok(
                ApiResponse.success("Xác thực OTP thành công, bạn có thể đăng nhập ngay bây giờ", null));
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<UserResponse>> login(
            @Valid @RequestBody LoginRequest request,
            HttpServletResponse response) {
        UserResponse user = authService.login(request, response);
        return ResponseEntity.ok(ApiResponse.success("Đăng nhập thành công", user));
    }

    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Void>> logout(HttpServletRequest request, HttpServletResponse response) {
        authService.logout(request, response);
        return ResponseEntity.ok(ApiResponse.success("Đăng xuất thành công", null));
    }

    @PostMapping("/refresh")
    public ResponseEntity<ApiResponse<UserResponse>> refresh(HttpServletRequest request, HttpServletResponse response){
        UserResponse user = authService.refresh(request, response);
        return ResponseEntity.ok(ApiResponse.success("Làm mới token thành công", user));
    }
}
