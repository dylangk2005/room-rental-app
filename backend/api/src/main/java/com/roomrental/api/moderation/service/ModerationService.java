package com.roomrental.api.moderation.service;

import com.roomrental.api.admin.dto.response.AdminUserPageResponse;
import com.roomrental.api.moderation.dto.request.BanUserRequest;
import com.roomrental.api.moderation.dto.response.ModerationPostPageResponse;
import com.roomrental.api.post.dto.response.PostDetailResponse;
import com.roomrental.api.post.entity.Post;
import com.roomrental.api.user.entity.User;

public interface ModerationService {

    ModerationPostPageResponse getPendingPosts(Post.PostStatus status, Integer postTypeId, Integer keyword, int page, int size);

    PostDetailResponse getPostDetail(Integer postId);

    PostDetailResponse approvePost(Integer moderatorId, Integer postId);
    PostDetailResponse rejectPost(Integer moderatorId, Integer postId, String reason);
    PostDetailResponse hidePost(Integer moderatorId, Integer postId, String reason);
    PostDetailResponse unhidePost(Integer moderatorId, Integer postId);
    PostDetailResponse removePost(Integer moderatorId, Integer postId, String reason);

    AdminUserPageResponse getNormalUsers(User.UserStatus status, String keyword, int page, int size);

    AdminUserPageResponse getUserDetail(Integer userId);

    void banUser(Integer moderatorId, Integer userId, BanUserRequest request);
    void clearUserPenalties(Integer moderatorId, Integer userId);
}
