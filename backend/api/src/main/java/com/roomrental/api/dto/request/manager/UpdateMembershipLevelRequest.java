package com.roomrental.api.dto.request.manager;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class UpdateMembershipLevelRequest {

    @NotNull
    private BigDecimal minSpent;

    @NotNull
    @Min(0)
    @Max(100)
    private Integer discountPercent;
}