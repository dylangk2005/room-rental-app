package com.roomrental.api.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Data
@Component
@ConfigurationProperties(prefix = "vnpay")
public class VnPayConfig {

    private String tmnCode;

    private String hashSecret;

    private String payUrl;

    private String returnUrl;

    private String ipnUrl;
}