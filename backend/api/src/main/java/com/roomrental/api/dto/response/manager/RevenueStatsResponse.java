package com.roomrental.api.dto.response.manager;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

@Data
@Builder
public class RevenueStatsResponse {
    private BigDecimal grossRevenue;
    private BigDecimal postPaymentRevenue;
    private BigDecimal renewRevenue;
    private BigDecimal pushRevenue;
    private BigDecimal refundAmount;
    private BigDecimal netRevenue;
}