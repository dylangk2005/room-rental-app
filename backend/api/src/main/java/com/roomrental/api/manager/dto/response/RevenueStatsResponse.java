package com.roomrental.api.manager.dto.response;

import java.math.BigDecimal;
import lombok.Builder;
import lombok.Data;

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