package com.roomrental.api.pricing.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import lombok.Data;

@Data
public class UpdateMembershipLevelRequest {

    @NotNull
    private BigDecimal minSpent;

    @NotNull
    @Min(0)
    @Max(100)
    private Integer discountPercent;
}