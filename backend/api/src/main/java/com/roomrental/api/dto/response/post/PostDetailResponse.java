package com.roomrental.api.dto.response.post;

import com.roomrental.api.entity.Post.PostStatus;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class PostDetailResponse {
    private Integer id;
    private String title;
    private String description;
    private String address;
    private String province;
    private String district;
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

    private List<String> imageUrls;
    private Boolean isFavorited;
}
