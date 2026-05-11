package com.roomrental.api.service;

public interface EmailService {
    void sendOtp(String toEmail, String otp); // Gửi mã OTP đến email người dùng
    void sendResetPasswordOtp(String toEmail, String otp); // Gửi mã OTP đến email người dùng khi quên mật khẩu

}
