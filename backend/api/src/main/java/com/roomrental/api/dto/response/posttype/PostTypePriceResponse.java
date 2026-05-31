package com.roomrental.api.dto.response.posttype;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

@Data
@Builder
public class PostTypePriceResponse {
    private Integer days;
    private BigDecimal price;
}
