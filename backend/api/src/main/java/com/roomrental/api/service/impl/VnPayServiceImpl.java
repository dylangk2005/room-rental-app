package com.roomrental.api.service.impl;

import com.roomrental.api.config.VnPayConfig;
import com.roomrental.api.service.VnPayService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.util.UriComponentsBuilder;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.math.BigDecimal;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
@RequiredArgsConstructor
public class VnPayServiceImpl implements VnPayService {

    private static final DateTimeFormatter VNPAY_DATE_FORMAT =
            DateTimeFormatter.ofPattern("yyyyMMddHHmmss");

    private final VnPayConfig vnpayConfig;

    @Override
    public String createPaymentUrl(String transactionRef, BigDecimal amount, String clientIp) {
        String createDate = LocalDateTime.now().format(VNPAY_DATE_FORMAT);
        String expireDate = LocalDateTime.now().plusMinutes(15).format(VNPAY_DATE_FORMAT);

        Map<String, String> params = new HashMap<>();
        params.put("vnp_Version", "2.1.0");
        params.put("vnp_Command", "pay");
        params.put("vnp_TmnCode", vnpayConfig.getTmnCode());
        params.put("vnp_Amount", amount.multiply(BigDecimal.valueOf(100)).toBigInteger().toString());
        params.put("vnp_CurrCode", "VND");
        params.put("vnp_TxnRef", transactionRef);
        params.put("vnp_OrderInfo", "Nap tien vi RoomRental " + transactionRef);
        params.put("vnp_OrderType", "other");
        params.put("vnp_Locale", "vn");
        params.put("vnp_ReturnUrl", vnpayConfig.getReturnUrl());
        params.put("vnp_IpAddr", clientIp);
        params.put("vnp_CreateDate", createDate);
        params.put("vnp_ExpireDate", expireDate);

        String hashData = buildHashData(params);
        String secureHash = hmacSha512(vnpayConfig.getHashSecret(), hashData);

        String query = buildQuery(params);

        return UriComponentsBuilder
                .fromUriString(vnpayConfig.getPayUrl())
                .query(query)
                .queryParam("vnp_SecureHash", secureHash)
                .build(true)
                .toUriString();
    }

    @Override
    public boolean verifySignature(Map<String, String> params) {
        String receivedHash = params.get("vnp_SecureHash");

        if (receivedHash == null || receivedHash.isBlank()) {
            return false;
        }

        Map<String, String> cleanParams = new HashMap<>(params);
        cleanParams.remove("vnp_SecureHash");
        cleanParams.remove("vnp_SecureHashType");

        String hashData = buildHashData(cleanParams);
        String calculatedHash = hmacSha512(vnpayConfig.getHashSecret(), hashData);

        return calculatedHash.equalsIgnoreCase(receivedHash);
    }

    private String buildHashData(Map<String, String> params) {
        List<String> fieldNames = new ArrayList<>(params.keySet());
        Collections.sort(fieldNames);

        List<String> pairs = new ArrayList<>();

        for (String fieldName : fieldNames) {
            String value = params.get(fieldName);

            if (value != null && !value.isBlank()) {
                pairs.add(fieldName + "=" + urlEncode(value));
            }
        }

        return String.join("&", pairs);
    }

    private String buildQuery(Map<String, String> params) {
        List<String> fieldNames = new ArrayList<>(params.keySet());
        Collections.sort(fieldNames);

        List<String> pairs = new ArrayList<>();

        for (String fieldName : fieldNames) {
            String value = params.get(fieldName);

            if (value != null && !value.isBlank()) {
                pairs.add(urlEncode(fieldName) + "=" + urlEncode(value));
            }
        }

        return String.join("&", pairs);
    }

    private String urlEncode(String value) {
        return URLEncoder.encode(value, StandardCharsets.UTF_8)
                .replace("+", "%20");
    }

    private String hmacSha512(String key, String data) {
        try {
            Mac hmac512 = Mac.getInstance("HmacSHA512");
            SecretKeySpec secretKey = new SecretKeySpec(
                    key.getBytes(StandardCharsets.UTF_8),
                    "HmacSHA512"
            );
            hmac512.init(secretKey);

            byte[] bytes = hmac512.doFinal(data.getBytes(StandardCharsets.UTF_8));

            StringBuilder hash = new StringBuilder();

            for (byte b : bytes) {
                hash.append(String.format("%02x", b));
            }

            return hash.toString();
        } catch (Exception e) {
            throw new IllegalStateException("Không thể tạo chữ ký VNPAY", e);
        }
    }
}