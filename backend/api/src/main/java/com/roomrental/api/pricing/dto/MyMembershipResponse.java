package com.roomrental.api.pricing.dto;

import java.math.BigDecimal;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class MyMembershipResponse {
    private Integer levelId;
    private String levelName;
    private BigDecimal minSpent;
    private Integer discountPercent;
    private BigDecimal totalSpent;

    private Integer nextLevelId;
    private String nextLevelName;
    private BigDecimal nextLevelMinSpent;
    private BigDecimal amountToNextLevel;
}