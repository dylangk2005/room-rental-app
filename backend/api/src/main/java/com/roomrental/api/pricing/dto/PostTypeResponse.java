package com.roomrental.api.pricing.dto;

import java.math.BigDecimal;
import java.util.List;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class PostTypeResponse {
    private Integer id;
    private String name;
    private String titleColor;
    private Integer titleSize;
    private Integer priority;
    private BigDecimal pushPrice;
    private List<PostTypePriceResponse> prices;
}