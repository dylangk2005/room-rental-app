package com.roomrental.api.moderation.dto.response;

import com.roomrental.api.post.entity.Post.PostStatus;
import java.time.LocalDateTime;
import java.util.List;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ReportDetailResponse {
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
    private String reporterAvatar;

    private Integer postId;
    private String postTitle;
    private String postStatus;
    private Integer postOwnerId;
    private String postOwnerName;

    private Integer moderatorId;
    private String moderatorName;
}