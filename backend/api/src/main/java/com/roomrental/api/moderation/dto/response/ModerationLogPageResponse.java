package com.roomrental.api.moderation.dto.response;

import java.util.List;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ModerationLogPageResponse {

    private List<ModerationLogResponse> logs;

    private int currentPage;

    private int totalPages;

    private long totalElements;
}