package com.roomrental.api.dto.response.moderation;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
public class ModerationPostSummaryResponse {
    private Integer id;
    private String title;

    private BigDecimal rentalPrice;
    private BigDecimal area;
    private String province;
    private String district;

    private String postTypeName;
    private String postTypeTitleColor;
    private Integer postTypeTitleSize;
    private Integer postTypePriority;

    private String ownerName;
    private LocalDateTime createdAt;

    private int imageCount;
}