package com.roomrental.api.service;

import com.roomrental.api.dto.response.moderation.ModerationPostPageResponse;
import com.roomrental.api.dto.response.post.PostDetailResponse;

public interface ModerationService {

    ModerationPostPageResponse getPendingPosts(Integer postTypeId, int page, int size);

    PostDetailResponse getPostDetail(Integer postId);

    PostDetailResponse approvePost(Integer moderatorId, Integer postId);

    PostDetailResponse rejectPost(Integer moderatorId, Integer postId, String reason);
}