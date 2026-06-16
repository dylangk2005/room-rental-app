package com.roomrental.api.post.dto.response;

import com.roomrental.api.post.entity.Post;
import com.roomrental.api.pricing.entity.PostType;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import lombok.Builder;
import lombok.Data;

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
    private String provinceName;
    private String districtName;
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
    private Boolean postTypeIsUppercase;
    private Boolean postTypeHasRecommendTag;
    private Integer postTypeMaxImageLimit;

    // Ảnh đại diện
    private String thumbnailUrl;
    private List<String> imageUrls;

    // Thông tin người đăng
    private Integer ownerId;
    private String ownerName;
    private String ownerAvatar;
}