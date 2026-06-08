package com.roomrental.api.dto.response.moderation;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class ModerationTargetDetailResponse {
    private String targetType;
    private Integer targetId;
    private PostSnapshot post;
    private ReportSnapshot report;
    private UserSnapshot user;
    private List<PenaltySnapshot> penalties;

    @Data
    @Builder
    public static class PostSnapshot {
        private Integer id;
        private String title;
        private String description;
        private String address;
        private String province;
        private String district;
        private BigDecimal area;
        private BigDecimal rentalPrice;
        private String status;
        private LocalDateTime createdAt;
        private LocalDateTime endAt;
        private String postTypeName;
        private UserSnapshot owner;
        private List<String> imageUrls;
    }

    @Data
    @Builder
    public static class ReportSnapshot {
        private Integer id;
        private String reason;
        private String description;
        private String status;
        private LocalDateTime createdAt;
        private LocalDateTime resolvedAt;
        private String resolutionNote;
        private UserSnapshot reporter;
        private UserSnapshot postOwner;
        private UserSnapshot moderator;
        private List<String> imageUrls;
    }

    @Data
    @Builder
    public static class UserSnapshot {
        private Integer id;
        private String fullName;
        private String email;
        private String phoneNumber;
        private String status;
        private String role;
        private String membershipLevel;
        private LocalDateTime createdAt;
    }

    @Data
    @Builder
    public static class PenaltySnapshot {
        private Integer id;
        private String type;
        private String reason;
        private LocalDateTime startDate;
        private LocalDateTime endDate;
        private LocalDateTime createdAt;
    }
}
