package com.roomrental.api.service;

public interface EmailService {
    void sendOtp(String toEmail, String otp); // Gửi mã OTP đến email người dùng
    void sendResetPasswordOtp(String toEmail, String otp); // Gửi mã OTP đến email người dùng khi quên mật khẩu
    void sendInternalAccountCredentials(String toEmail, String fullName, String role, String temporaryPassword); // Gửi thông tin tài khoản nội bộ (tên đầy đủ, vai trò, mật khẩu tạm thời) đến email người dùng
}
