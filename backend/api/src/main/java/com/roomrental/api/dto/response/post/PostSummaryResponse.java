package com.roomrental.api.dto.response.post;

import lombok.Builder;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class PostSummaryResponse {
    private Integer id;
    private String title;
    private String province;
    private String district;
    private BigDecimal area;
    private BigDecimal rentalPrice;
    private String status;
    private LocalDateTime endAt;
    private LocalDateTime pushTime;

    // PostType
    private String postTypeName;
    private String postTypeTitleColor;
    private Integer postTypeTitleSize;
    private Integer postTypePriority;
    private BigDecimal postTypePushPrice;

    // Ảnh đại diện
    private String thumbnailUrl;
    private List<String> imageUrls;
}
