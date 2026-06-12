package com.roomrental.api.pricing.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import java.math.BigDecimal;
import lombok.Data;

@Data
public class UpdatePostTypePriceRequest {

    @NotNull
    private Integer postTypeId;

    @NotNull
    private Integer days;

    @NotNull
    @Positive
    private BigDecimal price;
}