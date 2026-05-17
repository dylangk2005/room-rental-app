package com.roomrental.api.dto.response.report;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class ReportSummaryResponse {
    private Integer id;
    private String reason;
    private String status;
    private LocalDateTime createdAt;

    private Integer reporterId;
    private String reporterName;

    private Integer postId;
    private String postTitle;
    private String postStatus;

    private Integer imageCount;
}