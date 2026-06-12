package com.roomrental.api.post.dto.response;

import com.roomrental.api.post.entity.Post;
import java.util.List;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class PostPageResponse {
    private List<PostSummaryResponse> posts;
    private int currentPage;
    private int totalPages;
    private long totalElements;
}