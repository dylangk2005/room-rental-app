package com.roomrental.api.pricing.dto.response;

import java.math.BigDecimal;
import java.sql.Timestamp;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MembershipLevelResponse {
    private Integer id;
    private String name;
    private BigDecimal minSpent;
    private Integer discountPercent;
}
