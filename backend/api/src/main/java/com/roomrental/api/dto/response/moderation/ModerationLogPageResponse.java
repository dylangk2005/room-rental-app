package com.roomrental.api.dto.response.moderation;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class ModerationLogPageResponse {

    private List<ModerationLogResponse> logs;

    private int currentPage;

    private int totalPages;

    private long totalElements;
}