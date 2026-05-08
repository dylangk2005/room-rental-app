package com.roomrental.api.service;

public interface EmailService {
    void sendOtp(String toEmail, String otp);
}
