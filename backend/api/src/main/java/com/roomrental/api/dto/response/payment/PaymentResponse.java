package com.roomrental.api.dto.response.payment;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
public class PaymentResponse {

    private Integer paymentId;

    private Integer postId;

    private String paymentType;

    private Integer durationDays;

    private BigDecimal baseFee;

    private BigDecimal tax;

    private Integer discountPercent;

    private BigDecimal finalFee;

    private BigDecimal openingBalance;

    private BigDecimal closingBalance;

    private LocalDateTime postEndAt;

    private LocalDateTime pushTime;

    private LocalDateTime createdAt;
}
