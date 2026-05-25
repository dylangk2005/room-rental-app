package com.roomrental.api.service;

import com.roomrental.api.dto.request.post.CreatePostRequest;
import com.roomrental.api.dto.request.post.UpdatePostRequest;
import com.roomrental.api.dto.response.post.*;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.util.List;

public interface PostService {

    // Public
    // Lấy danh sách bài đăng đang hoạt động, có thể phân trang
    PostPageResponse getActivePosts(int page, int size);

    // Tìm kiếm bài đăng theo tiêu chí, có thể phân trang
    PostPageResponse searchPosts(String province, String district,
                                 BigDecimal minPrice, BigDecimal maxPrice,
                                 BigDecimal minArea, BigDecimal maxArea,
                                 int page, int size);

    // Xem thông tin chi tiết của phòng trọ, chưa bao gồm thông tin liên hệ
    PostDetailResponse getPostDetail(Integer postId);


    // Xem thông tin liên hệ của phòng trọ
    PostContactResponse getPostContact(Integer postId);

    // User
    // Tạo mới bài đăng, có thể upload nhiều ảnh
    PostDetailResponse createPost(Integer userId, CreatePostRequest request, List<MultipartFile> images);

    // Cập nhật bài đăng, có thể thay thế ảnh (xóa ảnh cũ và upload ảnh mới)
    PostDetailResponse updatePost(Integer userId, Integer postId,
                                  UpdatePostRequest request, List<MultipartFile> newImages);

    // Xóa bài đăng, chỉ người dùng tạo bài đăng mới được xóa
    void deletePost(Integer userId, Integer postId);

    // Lấy danh sách bài đăng của người dùng, có phân trang
    PostPageResponse getMyPosts(Integer userId, int page, int size);
}