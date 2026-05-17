package com.roomrental.api.dto.response.manager;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class PostStatsResponse {
    private long totalPosts;
    private long newPosts;
    private long draftPosts;
    private long pendingPosts;
    private long activePosts;
    private long rejectedPosts;
    private long expiredPosts;
    private long hiddenPosts;
    private long deletedPosts;
    private List<PostTypeStatsResponse> byPostType;
}