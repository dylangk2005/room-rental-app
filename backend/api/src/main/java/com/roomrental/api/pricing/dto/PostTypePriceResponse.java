package com.roomrental.api.pricing.dto;

import java.math.BigDecimal;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class PostTypePriceResponse {
    private Integer days;
    private BigDecimal price;
}