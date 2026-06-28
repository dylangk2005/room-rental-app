package com.roomrental.api.post.dto.response;

import com.roomrental.api.post.entity.Post;
import com.roomrental.api.pricing.entity.PostType;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
public class PostSummaryResponse {
    private Integer id;
    private String title;
    private String description;
    private String province;
    private String district;
    private Integer provinceId;
    private Integer districtId;
    private BigDecimal area;
    private BigDecimal rentalPrice;
    private String status;
    private LocalDateTime endAt;
    private LocalDateTime pushTime;
    private Integer durationDays;

    // PostType
    private String postTypeName;
    private String postTypeTitleColor;
    private Integer postTypeTitleSize;
    private Integer postTypePriority;
    private BigDecimal postTypePushPrice;
    private Boolean postTypeIsUppercase;
    private Boolean postTypeHasRecommendTag;
    private Integer postTypeMaxImageLimit;
    private List<PostTypePriceItem> prices;

    // Ảnh đại diện
    private String thumbnailUrl;
    private List<String> imageUrls;

    // Thông tin người đăng
    private Integer ownerId;
    private String ownerName;
    private String ownerAvatar;

    @Data
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    public static class PostTypePriceItem {
        private Integer days;
        private BigDecimal price;
    }
}