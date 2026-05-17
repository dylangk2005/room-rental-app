package com.roomrental.api.dto.request.manager;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;

import java.math.BigDecimal;

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