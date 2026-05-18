package com.roomrental.api.dto.response.membership;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.sql.Timestamp;

@Data
@Builder
public class MembershipLevelResponse {
    private Integer id;
    private String name;
    private BigDecimal minSpent;
    private Integer discountPercent;
}