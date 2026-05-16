package com.roomrental.api.controller;

import com.roomrental.api.dto.response.common.ApiResponse;
import com.roomrental.api.dto.response.post.PostPageResponse;
import com.roomrental.api.service.FavoriteService;
import com.roomrental.api.util.AuthHelper;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/favorites")
@RequiredArgsConstructor
@PreAuthorize("isAuthenticated()")
public class FavoriteController {

    private final FavoriteService favoriteService;
    private final AuthHelper authHelper;

    @PostMapping("/{postId}")
    public ResponseEntity<ApiResponse<Void>> addFavorite(@PathVariable Integer postId) {
        favoriteService.addFavorite(authHelper.getCurrentUserId(), postId);
        return ResponseEntity.ok(ApiResponse.success("Đã lưu tin vào yêu thích", null));
    }

    @DeleteMapping("/{postId}")
    public ResponseEntity<ApiResponse<Void>> removeFavorite(@PathVariable Integer postId) {
        favoriteService.removeFavorite(authHelper.getCurrentUserId(), postId);
        return ResponseEntity.ok(ApiResponse.success("Đã xóa tin khỏi yêu thích", null));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<PostPageResponse>> getMyFavorites(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(ApiResponse.success(
                favoriteService.getMyFavorites(authHelper.getCurrentUserId(), page, size)
        ));
    }
}