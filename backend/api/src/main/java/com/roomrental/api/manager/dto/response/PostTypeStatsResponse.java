package com.roomrental.api.manager.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class PostTypeStatsResponse {
    private String postTypeName;
    private int priority;
    private long totalPosts;
}