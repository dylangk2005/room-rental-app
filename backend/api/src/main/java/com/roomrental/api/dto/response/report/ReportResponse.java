package com.roomrental.api.dto.response.report;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class ReportResponse {
    private Integer id;
    private String reason;
    private String description;
    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime resolvedAt;
    private String resolutionNote;
    private List<String> imageUrls;

    private Integer reporterId;
    private String reporterName;
    private String reporterEmail;

    private Integer postId;
    private String postTitle;
    private String postStatus;
    private Integer postOwnerId;
    private String postOwnerName;

    private Integer moderatorId;
    private String moderatorName;
}