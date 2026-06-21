package com.roomrental.api.post.controller;

import com.roomrental.api.common.dto.ApiResponse;
import com.roomrental.api.common.exception.AppException;
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
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
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
            @RequestParam(required = false) Integer provinceId,
            @RequestParam(required = false) Integer districtId,
            @RequestParam(required = false) BigDecimal minPrice,
            @RequestParam(required = false) BigDecimal maxPrice,
            @RequestParam(required = false) BigDecimal minArea,
            @RequestParam(required = false) BigDecimal maxArea,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(ApiResponse.success(
                postService.searchPosts(provinceId, districtId, minPrice, maxPrice, minArea, maxArea, page, size)));
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
    public ResponseEntity<ApiResponse<PostContactResponse>> getPostContact(@PathVariable Integer id) {
        return ResponseEntity.ok(ApiResponse.success(postService.getPostContact(id)));
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<PostDetailResponse>> createPost(
            @RequestParam("title") String title,
            @RequestParam("description") String description,
            @RequestParam("address") String address,
            @RequestParam("provinceId") Integer provinceId,
            @RequestParam("districtId") Integer districtId,
            @RequestParam("area") BigDecimal area,
            @RequestParam("rentalPrice") BigDecimal rentalPrice,
            @RequestParam("postTypeId") Integer postTypeId,
            @RequestParam("durationDays") Integer durationDays,
            @RequestParam("images") List<MultipartFile> images) {

        CreatePostRequest request = new CreatePostRequest();
        request.setTitle(title);
        request.setDescription(description);
        request.setAddress(address);
        request.setProvinceId(provinceId);
        request.setDistrictId(districtId);
        request.setArea(area);
        request.setRentalPrice(rentalPrice);
        request.setPostTypeId(postTypeId);
        request.setDurationDays(durationDays);

        if (title == null || title.isBlank()) {
            throw AppException.badRequest("Tiêu đề không được để trống");
        }
        if (title.length() > 255) {
            throw AppException.badRequest("Tiêu đề tối đa 255 ký tự");
        }
        if (description == null || description.isBlank()) {
            throw AppException.badRequest("Mô tả không được để trống");
        }
        if (address == null || address.isBlank()) {
            throw AppException.badRequest("Địa chỉ không được để trống");
        }
        if (provinceId == null) {
            throw AppException.badRequest("Tỉnh/thành không được để trống");
        }
        if (districtId == null) {
            throw AppException.badRequest("Quận/huyện không được để trống");
        }
        if (area == null || area.compareTo(java.math.BigDecimal.ONE) < 0) {
            throw AppException.badRequest("Diện tích tối thiểu 1 m²");
        }
        if (rentalPrice == null || rentalPrice.compareTo(new java.math.BigDecimal("1000")) < 0) {
            throw AppException.badRequest("Giá thuê tối thiểu 1,000đ");
        }
        if (postTypeId == null) {
            throw AppException.badRequest("Loại tin không được để trống");
        }
        if (durationDays == null || durationDays < 1) {
            throw AppException.badRequest("Số ngày đăng tối thiểu 1 ngày");
        }
        if (images == null || images.isEmpty()) {
            throw AppException.badRequest("Phải tải lên ít nhất 1 ảnh");
        }

        return ResponseEntity.ok(ApiResponse.success(
                "Đã lưu tin nháp thành công",
                postService.createPost(authHelper.getCurrentUserId(), request, images)));
    }

    @PostMapping(value = "/pay", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<PaymentResponse>> createAndPayPost(
            @RequestParam("title") String title,
            @RequestParam("description") String description,
            @RequestParam("address") String address,
            @RequestParam("provinceId") Integer provinceId,
            @RequestParam("districtId") Integer districtId,
            @RequestParam("area") BigDecimal area,
            @RequestParam("rentalPrice") BigDecimal rentalPrice,
            @RequestParam("postTypeId") Integer postTypeId,
            @RequestParam("durationDays") Integer durationDays,
            @RequestParam("images") List<MultipartFile> images) {

        Integer userId = authHelper.getCurrentUserId();
        CreatePostRequest request = new CreatePostRequest();
        request.setTitle(title);
        request.setDescription(description);
        request.setAddress(address);
        request.setProvinceId(provinceId);
        request.setDistrictId(districtId);
        request.setArea(area);
        request.setRentalPrice(rentalPrice);
        request.setPostTypeId(postTypeId);
        request.setDurationDays(durationDays);

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
            @ModelAttribute UpdatePostRequest request,
            @RequestParam(value = "newImages", required = false) List<MultipartFile> newImages) {

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

    @RequestMapping(value = "/{id}/visibility", method = RequestMethod.PATCH)
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Void>> toggleVisibility(@PathVariable Integer id) {
        postService.toggleVisibility(authHelper.getCurrentUserId(), id);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật trạng thái hiển thị thành công", null));
    }
}
