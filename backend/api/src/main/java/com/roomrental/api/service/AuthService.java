package com.roomrental.api.service;

import com.roomrental.api.dto.request.LoginRequest;
import com.roomrental.api.dto.request.RegisterRequest;
import com.roomrental.api.dto.request.VerifyOtpRequest;
import com.roomrental.api.dto.response.UserResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

public interface AuthService {
    void register(RegisterRequest request); // Gửi OTP về email, lưu thông tin đăng ký tạm vào Redis
    void verifyOtp(VerifyOtpRequest request); // Kiểm tra OTP, nếu đúng thì tạo tài khoản và xóa thông tin tạm trong Redis
    UserResponse login(LoginRequest request, HttpServletResponse response); // Kiểm tra email + password, nếu đúng thì tạo JWT token và refresh token, lưu refresh token vào Redis, trả về token cho client
    void logout(HttpServletRequest request, HttpServletResponse response); // Xóa JWT token và refresh token khỏi client (xóa cookie) và Redis
    UserResponse refresh(HttpServletRequest request, HttpServletResponse response);
}
