package com.roomrental.api.dto.response.post;

import lombok.Builder;
import lombok.Data;
import java.util.List;

@Data
@Builder
public class PostPageResponse {
    private List<PostSummaryResponse> posts;
    private int currentPage;
    private int totalPages;
    private long totalElements;
}