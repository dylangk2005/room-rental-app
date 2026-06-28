package com.roomrental.api.moderation.dto.response;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import lombok.Builder;
import lombok.Data;

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
    private String ownerAvatar;
    private LocalDateTime createdAt;
    private String status;

    private int imageCount;
}