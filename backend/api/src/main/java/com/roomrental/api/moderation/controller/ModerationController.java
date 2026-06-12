package com.roomrental.api.moderation.controller;

import com.roomrental.api.admin.dto.response.AdminUserPageResponse;
import com.roomrental.api.common.dto.ApiResponse;
import com.roomrental.api.common.util.AuthHelper;
import com.roomrental.api.moderation.dto.request.BanUserRequest;
import com.roomrental.api.moderation.dto.response.ModerationPostPageResponse;
import com.roomrental.api.moderation.dto.request.RejectPostRequest;
import com.roomrental.api.moderation.service.ModerationService;
import com.roomrental.api.post.dto.response.PostDetailResponse;
import com.roomrental.api.user.entity.User;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/moderation")
@RequiredArgsConstructor
public class ModerationController {

    private final ModerationService moderationService;
    private final AuthHelper authHelper;

    @GetMapping("/posts")
    @PreAuthorize("hasRole('MODERATOR')")
    public ResponseEntity<ApiResponse<ModerationPostPageResponse>> getPendingPosts(
            @RequestParam(required = false) Integer postTypeId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        return ResponseEntity.ok(ApiResponse.success(
                moderationService.getPendingPosts(postTypeId, page, size)
        ));
    }

    @GetMapping("/posts/{id}")
    @PreAuthorize("hasRole('MODERATOR')")
    public ResponseEntity<ApiResponse<PostDetailResponse>> getPostDetail(@PathVariable Integer id) {
        return ResponseEntity.ok(ApiResponse.success(
                moderationService.getPostDetail(id)
        ));
    }

    @PutMapping("/posts/{id}/approve")
    @PreAuthorize("hasRole('MODERATOR')")
    public ResponseEntity<ApiResponse<PostDetailResponse>> approvePost(@PathVariable Integer id) {
        return ResponseEntity.ok(ApiResponse.success(
                "Duyệt tin thành công",
                moderationService.approvePost(authHelper.getCurrentUserId(), id)
        ));
    }

    @PutMapping("/posts/{id}/reject")
    @PreAuthorize("hasRole('MODERATOR')")
    public ResponseEntity<ApiResponse<PostDetailResponse>> rejectPost(
            @PathVariable Integer id,
            @Valid @RequestBody RejectPostRequest request) {

        return ResponseEntity.ok(ApiResponse.success(
                "Từ chối tin thành công, đã hoàn tiền cho người đăng",
                moderationService.rejectPost(authHelper.getCurrentUserId(), id, request.getReason())
        ));
    }

    @PutMapping("/users/{id}/ban")
    @PreAuthorize("hasRole('MODERATOR')")
    public ResponseEntity<ApiResponse<Void>> banUser(
            @PathVariable Integer id,
            @Valid @RequestBody BanUserRequest request) {

        moderationService.banUser(authHelper.getCurrentUserId(), id, request);
        return ResponseEntity.ok(ApiResponse.success("Xử lý tài khoản thành công", null));
    }
    @PutMapping("/users/{id}/penalties/clear")
    @PreAuthorize("hasRole('MODERATOR')")
    public ResponseEntity<ApiResponse<Void>> clearUserPenalties(@PathVariable Integer id) {
        moderationService.clearUserPenalties(authHelper.getCurrentUserId(), id);
        return ResponseEntity.ok(ApiResponse.success("Gỡ hình phạt tài khoản thành công", null));
    }

    @GetMapping("/users")
    @PreAuthorize("hasRole('MODERATOR')")
    public ResponseEntity<ApiResponse<AdminUserPageResponse>> getNormalUsers(
            @RequestParam(required = false) User.UserStatus status,
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        return ResponseEntity.ok(ApiResponse.success(
                moderationService.getNormalUsers(status, keyword, page, size)
        ));
    }
}