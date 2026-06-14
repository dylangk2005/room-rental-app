package com.roomrental.api.post.dto.response;

import com.roomrental.api.post.entity.Post.PostStatus;
import com.roomrental.api.post.entity.Post;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class PostDetailResponse {
    private Integer id;
    private String title;
    private String description;
    private String address;
    private String province;
    private String district;
    private Integer provinceId;
    private Integer districtId;
    private String provinceName;
    private String districtName;
    private BigDecimal area;
    private BigDecimal rentalPrice;
    private PostStatus status;
    private Integer ownerId;
    private String ownerName;
    private String ownerEmail;
    private String ownerPhoneNumber;
    private LocalDateTime createdAt;
    private LocalDateTime endAt;

    private String postTypeName;
    private String postTypeTitleColor;
    private Integer postTypeTitleSize;
    private Integer postTypePriority;
    private Boolean postTypeIsUppercase;
    private Boolean postTypeHasRecommendTag;
    private Integer postTypeMaxImageLimit;

    private List<String> imageUrls;
    private Boolean isFavorited;
}