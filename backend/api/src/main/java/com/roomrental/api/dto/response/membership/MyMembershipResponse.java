package com.roomrental.api.dto.response.membership;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

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