package com.roomrental.api.controller;

import com.roomrental.api.dto.request.*;
import com.roomrental.api.dto.response.ApiResponse;
import com.roomrental.api.dto.response.UserResponse;
import com.roomrental.api.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

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
    public ResponseEntity<ApiResponse<UserResponse>> login(
            @Valid @RequestBody LoginRequest request,
            HttpServletResponse response) {
        UserResponse user = authService.login(request, response);
        return ResponseEntity.ok(ApiResponse.success("Đăng nhập thành công", user));
    }

    @PostMapping("/logout") // Xóa JWT token và refresh token khỏi client (xóa cookie) và Redis
    public ResponseEntity<ApiResponse<Void>> logout(HttpServletRequest request, HttpServletResponse response) {
        authService.logout(request, response);
        return ResponseEntity.ok(ApiResponse.success("Đăng xuất thành công", null));
    }

    @PostMapping("/refresh") // Kiểm tra refresh token, nếu hợp lệ thì tạo JWT token mới và refresh token mới, cập nhật refresh token trong Redis, trả về token mới cho client
    public ResponseEntity<ApiResponse<UserResponse>> refresh(HttpServletRequest request, HttpServletResponse response){
        UserResponse user = authService.refresh(request, response);
        return ResponseEntity.ok(ApiResponse.success("Làm mới token thành công", user));
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

    @PutMapping("/change-password") // Kiểm tra JWT token để lấy thông tin user, kiểm tra mật khẩu cũ, nếu đúng thì cập nhật mật khẩu mới cho tài khoản
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
