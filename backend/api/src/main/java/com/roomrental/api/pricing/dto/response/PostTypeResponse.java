package com.roomrental.api.pricing.dto.response;

import java.math.BigDecimal;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PostTypeResponse {
    private Integer id;
    private String name;
    private String titleColor;
    private Integer titleSize;
    private Integer priority;
    private BigDecimal pushPrice;
    private List<PostTypePriceResponse> prices;
}
