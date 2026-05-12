package com.roomrental.api.dto.response;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class PostPageResponse {
    private List<PostResponse> posts;
    private Integer currentPage;
    private Integer totalPages;
    private Long totalElements;
}
