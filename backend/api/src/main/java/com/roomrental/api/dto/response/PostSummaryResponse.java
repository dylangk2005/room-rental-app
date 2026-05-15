package com.roomrental.api.dto.response;

import lombok.Builder;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
public class PostSummaryResponse {
    private Integer id;
    private String title;
    private String province;
    private String district;
    private BigDecimal area;
    private BigDecimal rentalPrice;
    private LocalDateTime endAt;

    // PostType
    private String postTypeName;
    private String postTypeTitleColor;
    private Integer postTypeTitleSize;
    private Integer postTypePriority;

    // Ảnh đại diện
    private String thumbnailUrl;
}