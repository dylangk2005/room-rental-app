package com.roomrental.api.integration.service;

import java.math.BigDecimal;
import java.util.Map;

public interface VnPayService {

    String createPaymentUrl(String transactionRef, BigDecimal amount, String clientIp);

    boolean verifySignature(Map<String, String> params);
}