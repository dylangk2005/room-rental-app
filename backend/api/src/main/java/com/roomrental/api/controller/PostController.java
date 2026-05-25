package com.roomrental.api.controller;

import com.roomrental.api.dto.request.post.CreatePostRequest;
import com.roomrental.api.dto.request.post.UpdatePostRequest;
import com.roomrental.api.dto.response.common.ApiResponse;
import com.roomrental.api.dto.response.post.*;
import com.roomrental.api.service.PostService;
import com.roomrental.api.util.AuthHelper;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/posts")
@RequiredArgsConstructor
public class PostController {

    private final PostService postService;
    private final AuthHelper authHelper;

    // ─── PUBLIC ───────────────────────────────────────────────────────────

    // Lấy danh sách bài đăng đang hoạt động, có thể phân trang
    @GetMapping
    public ResponseEntity<ApiResponse<PostPageResponse>> getActivePosts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(ApiResponse.success(
                postService.getActivePosts(page, size)));
    }

    // Tìm kiếm bài đăng theo tiêu chí, có thể phân trang
    @GetMapping("/search")
    public ResponseEntity<ApiResponse<PostPageResponse>> searchPosts(
            @RequestParam(required = false) String province,
            @RequestParam(required = false) String district,
            @RequestParam(required = false) BigDecimal minPrice,
            @RequestParam(required = false) BigDecimal maxPrice,
            @RequestParam(required = false) BigDecimal minArea,
            @RequestParam(required = false) BigDecimal maxArea,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(ApiResponse.success(
                postService.searchPosts(province, district,
                        minPrice, maxPrice, minArea, maxArea, page, size)));
    }

    // Xem thông tin chi tiết của phòng trọ, chưa bao gồm thông tin liên hệ
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<PostDetailResponse>> getPostDetail(
            @PathVariable Integer id) {
        return ResponseEntity.ok(ApiResponse.success(
                postService.getPostDetail(id)));
    }

    // Xem thông tin liên hệ của phòng trọ
    @GetMapping("/{id}/contact")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<PostContactResponse>> getPostContact(
            @PathVariable Integer id) {
        return ResponseEntity.ok(ApiResponse.success(
                postService.getPostContact(id)));
    }

    // ─── USER ─────────────────────────────────────────────────────────────

    // Tạo mới bài đăng, có thể upload nhiều ảnh
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<PostDetailResponse>> createPost(
            @RequestParam("title") String title,
            @RequestParam("description") String description,
            @RequestParam("address") String address,
            @RequestParam("province") String province,
            @RequestParam("district") String district,
            @RequestParam("area") BigDecimal area,
            @RequestParam("rentalPrice") BigDecimal rentalPrice,
            @RequestParam("postTypeId") Integer postTypeId,
            @RequestParam("durationDays") Integer durationDays,
            @RequestParam("images") List<MultipartFile> images) {

        CreatePostRequest request = new CreatePostRequest();
        request.setTitle(title);
        request.setDescription(description);
        request.setAddress(address);
        request.setProvince(province);
        request.setDistrict(district);
        request.setArea(area);
        request.setRentalPrice(rentalPrice);
        request.setPostTypeId(postTypeId);
        request.setDurationDays(durationDays);

        return ResponseEntity.ok(ApiResponse.success(
                "Đã lưu tin nháp, vui lòng thanh toán để đăng tin",
                postService.createPost(authHelper.getCurrentUserId(), request, images)));
    }

    // Cập nhật bài đăng, có thể thay thế ảnh (xóa ảnh cũ và upload ảnh mới)
    @PutMapping(value = "/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<PostDetailResponse>> updatePost(
            @PathVariable Integer id,
            @RequestParam("title") String title,
            @RequestParam("description") String description,
            @RequestParam("address") String address,
            @RequestParam("province") String province,
            @RequestParam("district") String district,
            @RequestParam("area") BigDecimal area,
            @RequestParam("rentalPrice") BigDecimal rentalPrice,
            @RequestParam(value = "deleteImageUrls", required = false) List<String> deleteImageUrls,
            @RequestParam(value = "newImages", required = false) List<MultipartFile> newImages) {

        UpdatePostRequest request = new UpdatePostRequest();
        request.setTitle(title);
        request.setDescription(description);
        request.setAddress(address);
        request.setProvince(province);
        request.setDistrict(district);
        request.setArea(area);
        request.setRentalPrice(rentalPrice);
        request.setDeleteImageUrls(deleteImageUrls);

        return ResponseEntity.ok(ApiResponse.success(
                "Cập nhật thành công",
                postService.updatePost(authHelper.getCurrentUserId(), id, request, newImages)));
    }

    // Xóa bài đăng, chỉ người dùng tạo bài đăng mới được xóa
    @DeleteMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Void>> deletePost(@PathVariable Integer id) {
        postService.deletePost(authHelper.getCurrentUserId(), id);
        return ResponseEntity.ok(ApiResponse.success("Xóa tin thành công", null));
    }

    // Lấy danh sách bài đăng của người dùng, có phân trang
    @GetMapping("/my-posts")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<PostPageResponse>> getMyPosts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(ApiResponse.success(
                postService.getMyPosts(authHelper.getCurrentUserId(), page, size)));
    }

}