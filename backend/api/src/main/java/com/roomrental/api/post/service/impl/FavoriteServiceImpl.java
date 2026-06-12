package com.roomrental.api.post.service.impl;

import com.roomrental.api.common.exception.AppException;
import com.roomrental.api.post.dto.response.PostPageResponse;
import com.roomrental.api.post.dto.response.PostSummaryResponse;
import com.roomrental.api.post.entity.Favorite;
import com.roomrental.api.post.entity.Post.PostStatus;
import com.roomrental.api.post.entity.Post;
import com.roomrental.api.post.entity.PostImage;
import com.roomrental.api.post.repository.FavoriteRepository;
import com.roomrental.api.post.repository.PostImageRepository;
import com.roomrental.api.post.repository.PostRepository;
import com.roomrental.api.post.service.FavoriteService;
import com.roomrental.api.pricing.entity.PostType;
import com.roomrental.api.user.entity.User;
import com.roomrental.api.user.repository.UserRepository;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class FavoriteServiceImpl implements FavoriteService {

    private final FavoriteRepository favoriteRepository;
    private final UserRepository userRepository;
    private final PostRepository postRepository;
    private final PostImageRepository postImageRepository;

    @Override
    @Transactional
    public void addFavorite(Integer userId, Integer postId) {
        if (favoriteRepository.existsByUser_IdAndPost_Id(userId, postId)) {
            return;
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> AppException.notFound("Không tìm thấy người dùng"));

        Post post = postRepository.findById(postId)
                .orElseThrow(() -> AppException.notFound("Không tìm thấy tin đăng"));

        if (post.getStatus() != Post.PostStatus.ACTIVE) {
            throw AppException.badRequest("Chỉ có thể yêu thích tin đang hoạt động");
        }

        Favorite.FavoriteId favoriteId = new Favorite.FavoriteId();
        favoriteId.setUserId(userId);
        favoriteId.setPostId(postId);

        Favorite favorite = new Favorite();
        favorite.setId(favoriteId);
        favorite.setUser(user);
        favorite.setPost(post);
        favorite.setCreatedAt(LocalDateTime.now());

        favoriteRepository.save(favorite);
    }

    @Override
    @Transactional
    public void removeFavorite(Integer userId, Integer postId) {
        if (!favoriteRepository.existsByUser_IdAndPost_Id(userId, postId)) {
            throw AppException.notFound("Tin đăng chưa có trong danh sách yêu thích");
        }

        favoriteRepository.deleteByUser_IdAndPost_Id(userId, postId);
    }

    @Override
    @Transactional(readOnly = true)
    public PostPageResponse getMyFavorites(Integer userId, int page, int size) {
        Pageable pageable = PageRequest.of(
                page,
                size,
                Sort.by(Sort.Order.desc("createdAt"))
        );

        Page<Favorite> favoritePage = favoriteRepository.findByUser_Id(userId, pageable);

        List<Post> posts = favoritePage.getContent().stream()
                .map(Favorite::getPost)
                .toList();

        List<Integer> postIds = posts.stream()
                .map(Post::getId)
                .toList();

        Map<Integer, List<String>> imageMap = postIds.isEmpty()
                ? Map.of()
                : postImageRepository.findByPostIdInOrderByPostIdAndId(postIds)
                .stream()
                .collect(Collectors.groupingBy(
                        image -> image.getPost().getId(),
                        LinkedHashMap::new,
                        Collectors.mapping(PostImage::getImageUrl, Collectors.toList())
                ));

        List<PostSummaryResponse> postResponses = posts.stream()
                .map(post -> mapToSummary(post, imageMap.getOrDefault(post.getId(), List.of())))
                .toList();

        return PostPageResponse.builder()
                .posts(postResponses)
                .currentPage(favoritePage.getNumber())
                .totalPages(favoritePage.getTotalPages())
                .totalElements(favoritePage.getTotalElements())
                .build();
    }

    private PostSummaryResponse mapToSummary(Post post, List<String> imageUrls) {
        PostType postType = post.getPostType();
        String thumbnailUrl = imageUrls.isEmpty() ? null : imageUrls.get(0);

        return PostSummaryResponse.builder()
                .id(post.getId())
                .title(post.getTitle())
                .province(post.getProvince())
                .district(post.getDistrict())
                .area(post.getArea())
                .rentalPrice(post.getRentalPrice())
                .status(post.getStatus() != null ? post.getStatus().name() : null)
                .endAt(post.getEndAt())
                .pushTime(post.getPushTime())
                .postTypeName(postType != null ? postType.getName() : null)
                .postTypeTitleColor(postType != null ? postType.getTitleColor() : null)
                .postTypeTitleSize(postType != null ? postType.getTitleSize() : null)
                .postTypePriority(postType != null ? postType.getPriority() : null)
                .postTypePushPrice(postType != null ? postType.getPushPrice() : null)
                .thumbnailUrl(thumbnailUrl)
                .imageUrls(imageUrls)
                .build();
    }
}