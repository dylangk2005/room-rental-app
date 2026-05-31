package com.roomrental.api.dto.response.posttype;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

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
