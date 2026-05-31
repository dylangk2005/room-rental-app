package com.roomrental.api.service;

import com.roomrental.api.dto.request.auth.*;
import com.roomrental.api.dto.response.user.UserResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

public interface AuthService {
    void register(RegisterRequest request); // Gửi OTP về email, lưu thông tin đăng ký tạm vào Redis
    void verifyOtp(VerifyOtpRequest request); // Kiểm tra OTP, nếu đúng thì tạo tài khoản và xóa thông tin tạm trong Redis
    UserResponse login(LoginRequest request, HttpServletResponse response); // Kiểm tra email + password, nếu đúng thì tạo JWT token và refresh token, lưu refresh token vào Redis, trả về token cho client
    void logout(HttpServletRequest request, HttpServletResponse response); // Xóa JWT token và refresh token khỏi client (xóa cookie) và Redis
    UserResponse refresh(HttpServletRequest request, HttpServletResponse response); // Kiểm tra refresh token, nếu hợp lệ thì tạo JWT token mới và refresh token mới, cập nhật refresh token trong Redis, trả về token mới cho client
    void forgotPassword(ForgotPasswordRequest request); // Kiểm tra email, nếu tồn tại thì tạo OTP, lưu OTP vào Redis, gửi OTP về email
    void resetPassword(ResetPasswordRequest request); // Kiểm tra email + OTP, nếu đúng thì cập nhật mật khẩu mới cho tài khoản, xóa OTP khỏi Redis
    void requestChangePasswordOtp(String email); // Gửi OTP đổi mật khẩu về email đã đăng ký
    void changePassword(String email, ChangePasswordRequest request); // Kiểm tra JWT token để lấy thông tin user, kiểm tra mật khẩu cũ, nếu đúng thì cập nhật mật khẩu mới cho tài khoản
}
