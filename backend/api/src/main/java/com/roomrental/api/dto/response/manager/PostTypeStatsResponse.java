package com.roomrental.api.dto.response.manager;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class PostTypeStatsResponse {
    private String postTypeName;
    private long totalPosts;
}