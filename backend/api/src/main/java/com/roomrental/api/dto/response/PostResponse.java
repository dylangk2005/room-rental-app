package com.roomrental.api.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class PostResponse {
    private Integer id;
    private String title;
    private String description;
    private String address;
    private String province;
    private String district;
    private String area; // Định dạng: "20 m²"
    private String rentalPrice; // Định dạng: "5,000,000 VND"
    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime pushTime;
    private LocalDateTime endAt;

    // PostType Info
    private Integer postTypeId;
    private String postTypeName;
    private String postTypeTitleColor;
    private Integer postTypePriority;
    private String postTypeTitleSize;

    //Owner Info
    private Integer ownerId;
    private String ownerName;
    private String ownerPhone;
    private String ownerAvatar;

    // Images
    private List<String> imageUrls;
}
