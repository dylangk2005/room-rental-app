package com.roomrental.api.moderation.dto;

import java.util.List;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ModerationPostPageResponse {
    private List<ModerationPostSummaryResponse> posts;
    private int currentPage;
    private int totalPages;
    private long totalElements;
}