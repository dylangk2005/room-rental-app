package com.roomrental.api.service;

import com.roomrental.api.dto.request.LoginRequest;
import com.roomrental.api.dto.request.RegisterRequest;
import com.roomrental.api.dto.request.VerifyOtpRequest;
import com.roomrental.api.dto.response.UserResponse;
import jakarta.servlet.http.HttpServletResponse;

public interface AuthService {
    void register(RegisterRequest request);
    void verifyOtp(VerifyOtpRequest request);
    UserResponse login(LoginRequest request, HttpServletResponse response);
    void logout(HttpServletResponse response);
}
