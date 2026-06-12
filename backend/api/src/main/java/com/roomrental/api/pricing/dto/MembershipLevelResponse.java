package com.roomrental.api.pricing.dto;

import java.math.BigDecimal;
import java.sql.Timestamp;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class MembershipLevelResponse {
    private Integer id;
    private String name;
    private BigDecimal minSpent;
    private Integer discountPercent;
}