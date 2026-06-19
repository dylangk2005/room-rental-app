package com.roomrental.api.post.service;

import com.roomrental.api.post.dto.request.CreatePostRequest;
import com.roomrental.api.post.dto.response.PostContactResponse;
import com.roomrental.api.post.dto.response.PostDetailResponse;
import com.roomrental.api.post.dto.response.PostLocationResponse;
import com.roomrental.api.post.dto.response.PostPageResponse;
import com.roomrental.api.post.dto.request.UpdatePostRequest;
import java.math.BigDecimal;
import java.util.List;
import org.springframework.web.multipart.MultipartFile;

public interface PostService {

    PostPageResponse getActivePosts(int page, int size);

    PostPageResponse searchPosts(Integer provinceId, Integer districtId,
                                 BigDecimal minPrice, BigDecimal maxPrice,
                                 BigDecimal minArea, BigDecimal maxArea,
                                 int page, int size);

    List<PostLocationResponse> getActiveLocations();

    PostDetailResponse getPostDetail(Integer postId);

    PostContactResponse getPostContact(Integer postId);

    PostDetailResponse createPost(Integer userId, CreatePostRequest request, List<MultipartFile> images);

    PostDetailResponse updatePost(Integer userId, Integer postId,
                                  UpdatePostRequest request, List<MultipartFile> newImages);

    void deletePost(Integer userId, Integer postId);

    PostPageResponse getMyPosts(Integer userId, int page, int size);
}
