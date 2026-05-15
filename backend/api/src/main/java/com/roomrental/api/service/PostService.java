package com.roomrental.api.service;

import com.roomrental.api.dto.request.post.CreatePostRequest;
import com.roomrental.api.dto.request.post.UpdatePostRequest;
import com.roomrental.api.dto.response.post.*;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.util.List;

public interface PostService {

    // Public
    PostPageResponse getActivePosts(int page, int size);
    PostPageResponse searchPosts(String province, String district,
                                 BigDecimal minPrice, BigDecimal maxPrice,
                                 BigDecimal minArea, BigDecimal maxArea,
                                 int page, int size);
    PostDetailResponse getPostDetail(Integer postId);
    PostContactResponse getPostContact(Integer postId);

    // User
    PostDetailResponse createPost(Integer userId, CreatePostRequest request, List<MultipartFile> images);
    PostDetailResponse updatePost(Integer userId, Integer postId,
                                  UpdatePostRequest request, List<MultipartFile> newImages);
    void deletePost(Integer userId, Integer postId);
    PostPageResponse getMyPosts(Integer userId, int page, int size);
}