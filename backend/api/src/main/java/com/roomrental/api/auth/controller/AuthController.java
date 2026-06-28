package com.roomrental.api.auth.controller;

import com.roomrental.api.auth.dto.response.AuthResponse;
import com.roomrental.api.auth.dto.request.ChangePasswordRequest;
import com.roomrental.api.auth.dto.request.ForgotPasswordRequest;
import com.roomrental.api.auth.dto.request.LoginRequest;
import com.roomrental.api.auth.dto.request.RegisterRequest;
import com.roomrental.api.auth.dto.request.ResetPasswordRequest;
import com.roomrental.api.auth.dto.request.VerifyOtpRequest;
import com.roomrental.api.auth.service.AuthService;
import com.roomrental.api.common.dto.ApiResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

/**
 * REST Controller xử lý các API liên quan đến xác thực người dùng.
 * Bao gồm đăng ký, đăng nhập, đăng xuất, làm mới token, và quản lý mật khẩu.
 */
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {
    private final AuthService authService;

    @PostMapping("/register") // Gửi OTP về email, lưu thông tin đăng ký tạm vào Redis
    public ResponseEntity<ApiResponse<Void>> register(
            @Valid @RequestBody RegisterRequest request) {
        authService.register(request);
        return ResponseEntity.ok(
                ApiResponse.success("Đăng ký thành công, vui lòng kiểm tra email để xác thực OTP", null));
    }

    @PostMapping("/verify-otp") // Kiểm tra OTP, nếu đúng thì tạo tài khoản và xóa thông tin tạm trong Redis
    public ResponseEntity<ApiResponse<Void>> verifyOtp(
            @Valid @RequestBody VerifyOtpRequest request) {
        authService.verifyOtp(request);
        return ResponseEntity.ok(
                ApiResponse.success("Xác thực OTP thành công, bạn có thể đăng nhập ngay bây giờ", null));
    }

    @PostMapping("/login") // Kiểm tra email + password, nếu đúng thì tạo JWT token và refresh token, lưu refresh token vào Redis, trả về token cho client
    public ResponseEntity<ApiResponse<AuthResponse>> login(
            @Valid @RequestBody LoginRequest request,
            HttpServletResponse response) {
        AuthResponse authResponse = authService.login(request, response);
        return ResponseEntity.ok(ApiResponse.success("Đăng nhập thành công", authResponse));
    }

    @PostMapping("/logout") // Xóa JWT token và refresh token khỏi client (xóa cookie) và Redis
    public ResponseEntity<ApiResponse<Void>> logout(HttpServletRequest request, HttpServletResponse response) {
        authService.logout(request, response);
        return ResponseEntity.ok(ApiResponse.success("Đăng xuất thành công", null));
    }

    @PostMapping("/refresh") // Kiểm tra refresh token, nếu hợp lệ thì tạo JWT token mới và refresh token mới, cập nhật refresh token trong Redis, trả về token mới cho client
    public ResponseEntity<ApiResponse<AuthResponse>> refresh(HttpServletRequest request, HttpServletResponse response){
        AuthResponse authResponse = authService.refresh(request, response);
        return ResponseEntity.ok(ApiResponse.success("Làm mới token thành công", authResponse));
    }

    @PostMapping("/forgot-password") // Kiểm tra email, nếu tồn tại thì tạo OTP, lưu OTP vào Redis, gửi OTP về email
    public ResponseEntity<ApiResponse<Void>> forgotPassword(
            @Valid @RequestBody ForgotPasswordRequest request){
        authService.forgotPassword(request);
        return ResponseEntity.ok(ApiResponse.success("Mã OTP đã được gửi đến email của bạn, vui lòng kiểm tra hộp thư để lấy mã OTP", null));
    }

    @PostMapping("/reset-password") // Kiểm tra email + OTP, nếu đúng thì cập nhật mật khẩu mới cho tài khoản, xóa OTP khỏi Redis
    public ResponseEntity<ApiResponse<Void>> resetPassword(
            @Valid @RequestBody ResetPasswordRequest request) {
        authService.resetPassword(request);
        return ResponseEntity.ok(
                ApiResponse.success("Đặt lại mật khẩu thành công, vui lòng đăng nhập lại", null));
    }

    @PostMapping("/change-password/otp") // Gửi OTP đổi mật khẩu về email đã đăng ký
    public ResponseEntity<ApiResponse<Void>> requestChangePasswordOtp() {
        String email = SecurityContextHolder.getContext()
                .getAuthentication()
                .getName();
        authService.requestChangePasswordOtp(email);
        return ResponseEntity.ok(
                ApiResponse.success("Mã OTP đã được gửi đến email đã đăng ký", null));
    }

    @PutMapping("/change-password") // Kiểm tra JWT token để lấy thông tin người dùng, kiểm tra mật khẩu cũ, OTP, nếu đúng thì cập nhật mật khẩu mới cho tài khoản
    public ResponseEntity<ApiResponse<Void>> changePassword(
            @Valid @RequestBody ChangePasswordRequest request) {
        // Lấy email từ SecurityContext (Đã được set bởi JwtAuthenticationFilter)
        String email = SecurityContextHolder.getContext()
                .getAuthentication()
                .getName();
        authService.changePassword(email, request);
        return ResponseEntity.ok(
                ApiResponse.success("Đổi mật khẩu thành công, vui lòng đăng nhập lại với mật khẩu mới", null));
    }

}
