package com.roomrental.api.post.controller;

import com.roomrental.api.common.dto.ApiResponse;
import com.roomrental.api.common.util.AuthHelper;
import com.roomrental.api.post.dto.request.CreatePostRequest;
import com.roomrental.api.post.dto.response.PostContactResponse;
import com.roomrental.api.post.dto.response.PostDetailResponse;
import com.roomrental.api.post.dto.response.PostLocationResponse;
import com.roomrental.api.post.dto.response.PostPageResponse;
import com.roomrental.api.post.dto.request.UpdatePostRequest;
import com.roomrental.api.payment.dto.request.PayPostRequest;
import com.roomrental.api.payment.dto.response.PaymentResponse;
import com.roomrental.api.payment.service.PaymentService;
import com.roomrental.api.post.service.PostService;
import java.math.BigDecimal;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/posts")
@RequiredArgsConstructor
public class PostController {

    private final PostService postService;
    private final PaymentService paymentService;
    private final AuthHelper authHelper;

    @GetMapping
    public ResponseEntity<ApiResponse<PostPageResponse>> getActivePosts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(ApiResponse.success(postService.getActivePosts(page, size)));
    }

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
                postService.searchPosts(province, district, minPrice, maxPrice, minArea, maxArea, page, size)));
    }

    @GetMapping("/locations")
    public ResponseEntity<ApiResponse<List<PostLocationResponse>>> getActiveLocations() {
        return ResponseEntity.ok(ApiResponse.success(postService.getActiveLocations()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<PostDetailResponse>> getPostDetail(@PathVariable Integer id) {
        return ResponseEntity.ok(ApiResponse.success(postService.getPostDetail(id)));
    }

    @GetMapping("/{id}/contact")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<PostContactResponse>> getPostContact(@PathVariable Integer id) {
        return ResponseEntity.ok(ApiResponse.success(postService.getPostContact(id)));
    }

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
                "Đã lưu tin nháp, vui lòng thanh toán để đăng tin",
                postService.createPost(authHelper.getCurrentUserId(), request, images)));
    }

    @PostMapping(value = "/pay", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<PaymentResponse>> createAndPayPost(
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

        Integer userId = authHelper.getCurrentUserId();
        CreatePostRequest request = buildCreatePostRequest(
                title,
                description,
                address,
                province,
                district,
                area,
                rentalPrice,
                postTypeId,
                durationDays
        );

        PostDetailResponse createdPost = postService.createPost(userId, request, images);

        PayPostRequest paymentRequest = new PayPostRequest();
        paymentRequest.setPostId(createdPost.getId());
        paymentRequest.setDurationDays(durationDays);

        PaymentResponse response = paymentService.payPost(userId, paymentRequest);

        return ResponseEntity.ok(ApiResponse.success(
                "Đã thanh toán đăng tin thành công, tin đang chờ kiểm duyệt",
                response));
    }

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

    @DeleteMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Void>> deletePost(@PathVariable Integer id) {
        postService.deletePost(authHelper.getCurrentUserId(), id);
        return ResponseEntity.ok(ApiResponse.success("Xóa tin thành công", null));
    }

    @GetMapping("/my-posts")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<PostPageResponse>> getMyPosts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(ApiResponse.success(postService.getMyPosts(authHelper.getCurrentUserId(), page, size)));
    }

    private CreatePostRequest buildCreatePostRequest(
            String title,
            String description,
            String address,
            String province,
            String district,
            BigDecimal area,
            BigDecimal rentalPrice,
            Integer postTypeId,
            Integer durationDays) {
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
        return request;
    }
}
