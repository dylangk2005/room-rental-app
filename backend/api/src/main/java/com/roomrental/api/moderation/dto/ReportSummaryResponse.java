package com.roomrental.api.moderation.dto;

import com.roomrental.api.post.entity.Post.PostStatus;
import java.time.LocalDateTime;
import lombok.Builder;
import lombok.Data;

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