package com.roomrental.api.service;

import com.roomrental.api.dto.request.moderation.BanUserRequest;
import com.roomrental.api.dto.response.moderation.ModerationPostPageResponse;
import com.roomrental.api.dto.response.post.PostDetailResponse;

public interface ModerationService {

    ModerationPostPageResponse getPendingPosts(Integer postTypeId, int page, int size); // lấy danh sách tin đăng chờ duyệt

    PostDetailResponse getPostDetail(Integer postId);  // Xem chi tiết tin đăng chờ duyệt

    PostDetailResponse approvePost(Integer moderatorId, Integer postId); // Duyệt tin đăng
    PostDetailResponse rejectPost(Integer moderatorId, Integer postId, String reason);  // Từ chối tin đăng

    void banUser(Integer moderatorId, Integer userId, BanUserRequest request); // Ban user
}