package com.roomrental.api.service.impl;

import com.roomrental.api.service.EmailService;
import lombok.RequiredArgsConstructor;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class EmailServiceImpl implements EmailService {

    private final JavaMailSender mailSender;
    private String fromEmail;

    @Override
    public void sendOtp(String toEmail, String otp) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom("TayTro <" + fromEmail + ">");
        message.setTo(toEmail);
        message.setSubject("[TayTro.vn] Mã xác thực OTP");
        message.setText(
                "Xin chào,\n\n" +
                "Mã xác thực OTP của bạn là: " + otp + "\n\n" +
                "Mã này có hiệu lực trong 5 phút.\n\n" +
                "Vui lòng không chia sẻ mã này với bất kỳ ai. \n\n" +
                "Trân trọng,\n" +
                "Đội ngũ TayTro"
        );
        mailSender.send(message);
    }
}
