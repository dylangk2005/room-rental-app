package com.roomrental.api.dto.response.moderation;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class ModerationPostPageResponse {
    private List<ModerationPostSummaryResponse> posts;
    private int currentPage;
    private int totalPages;
    private long totalElements;
}