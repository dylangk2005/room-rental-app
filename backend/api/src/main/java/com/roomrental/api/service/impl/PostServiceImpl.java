package com.roomrental.api.service.impl;

import com.roomrental.api.dto.request.post.CreatePostRequest;
import com.roomrental.api.dto.request.post.UpdatePostRequest;
import com.roomrental.api.dto.response.post.*;
import com.roomrental.api.entity.*;
import com.roomrental.api.entity.Post.PostStatus;
import com.roomrental.api.exception.AppException;
import com.roomrental.api.repository.*;
import com.roomrental.api.service.AuditLogService;
import com.roomrental.api.service.CloudinaryService;
import com.roomrental.api.service.PostService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PostServiceImpl implements PostService {

    private final PostRepository postRepository;
    private final PostImageRepository postImageRepository;
    private final PostTypeRepository postTypeRepository;
    private final UserRepository userRepository;
    private final CloudinaryService cloudinaryService;
    private final AuditLogService auditLogService;
    private final UserPenaltyRepository userPenaltyRepository;

    // ─── Pageable sort theo priority ASC, pushTime DESC ──────────────────
    private Pageable buildSortedPageable(int page, int size) {
        Sort sort = Sort.by(Sort.Order.asc("postType.priority"),
                Sort.Order.desc("pushTime"));
        return PageRequest.of(page, size, sort);
    }

    // ─── map Post → PostSummaryResponse ──────────────────────────────────
    private PostSummaryResponse mapToSummary(Post post, String thumbnailUrl) {
        PostType pt = post.getPostType();
        return PostSummaryResponse.builder()
                .id(post.getId())
                .title(post.getTitle())
                .province(post.getProvince())
                .district(post.getDistrict())
                .area(post.getArea())
                .rentalPrice(post.getRentalPrice())
                .endAt(post.getEndAt())
                .postTypeName(pt != null ? pt.getName() : null)
                .postTypeTitleColor(pt != null ? pt.getTitleColor() : null)
                .postTypeTitleSize(pt != null ? pt.getTitleSize() : null)
                .postTypePriority(pt != null ? pt.getPriority() : null)
                .thumbnailUrl(thumbnailUrl)
                .build();
    }

    // ─── map Post → PostDetailResponse ───────────────────────────────────
    private PostDetailResponse mapToDetail(Post post, List<String> imageUrls) {
        PostType pt = post.getPostType();
        return PostDetailResponse.builder()
                .id(post.getId())
                .title(post.getTitle())
                .description(post.getDescription())
                .address(post.getAddress())
                .province(post.getProvince())
                .district(post.getDistrict())
                .area(post.getArea())
                .rentalPrice(post.getRentalPrice())
                .status(post.getStatus())
                .createdAt(post.getCreatedAt())
                .endAt(post.getEndAt())
                .postTypeName(pt != null ? pt.getName() : null)
                .postTypeTitleColor(pt != null ? pt.getTitleColor() : null)
                .postTypeTitleSize(pt != null ? pt.getTitleSize() : null)
                .postTypePriority(pt != null ? pt.getPriority() : null)
                .imageUrls(imageUrls)
                .build();
    }


    // ─── map Page<Post> → PostPageResponse ───────────────────────────────
    private PostPageResponse mapToPageResponse(Page<Post> page) {
        List<Integer> postIds = page.getContent().stream()
                .map(Post::getId).toList();

        Map<Integer, String> thumbnailMap = postImageRepository
                .findThumbnailsByPostIdIn(postIds)
                .stream()
                .collect(Collectors.toMap(
                        img -> img.getPost().getId(),
                        PostImage::getImageUrl
                ));

        List<PostSummaryResponse> posts = page.getContent().stream()
                .map(p -> mapToSummary(p, thumbnailMap.get(p.getId())))
                .toList();

        return PostPageResponse.builder()
                .posts(posts)
                .currentPage(page.getNumber())
                .totalPages(page.getTotalPages())
                .totalElements(page.getTotalElements())
                .build();
    }

    @Override
    public PostPageResponse getActivePosts(int page, int size) {
        Page<Post> result = postRepository.findByStatus(
                PostStatus.ACTIVE, buildSortedPageable(page, size));
        return mapToPageResponse(result);
    }

    @Override
    public PostPageResponse searchPosts(String province, String district,
                                        BigDecimal minPrice, BigDecimal maxPrice,
                                        BigDecimal minArea, BigDecimal maxArea,
                                        int page, int size) {
        Page<Post> result = postRepository.searchPosts(
                province, district, minPrice, maxPrice, minArea, maxArea,
                buildSortedPageable(page, size));
        return mapToPageResponse(result);
    }

    @Override
    public PostDetailResponse getPostDetail(Integer postId) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> AppException.notFound("Không tìm thấy tin đăng"));
        List<String> imageUrls = postImageRepository.findByPostId(postId)
                .stream().map(PostImage::getImageUrl).toList();
        return mapToDetail(post, imageUrls);
    }

    @Override
    public PostContactResponse getPostContact(Integer postId) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> AppException.notFound("Không tìm thấy tin đăng"));
        if (post.getStatus() != PostStatus.ACTIVE) {
            throw AppException.badRequest("Tin đăng không còn hiệu lực");
        }
        User owner = post.getUser();
        return PostContactResponse.builder()
                .ownerId(owner.getId())
                .ownerName(owner.getFullName())
                .ownerPhone(owner.getPhoneNumber())
                .build();
    }

    @Override
    @Transactional
    public PostDetailResponse createPost(Integer userId, CreatePostRequest request,
                                         List<MultipartFile> images) {
        if (images == null || images.isEmpty()) {
            throw AppException.badRequest("Phải tải lên ít nhất 1 ảnh");
        }
        if (images.size() > 7) {
            throw AppException.badRequest("Không được tải lên quá 7 ảnh");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> AppException.notFound("Không tìm thấy người dùng"));

       ensureUserCanPost(user);

        PostType postType = postTypeRepository.findById(request.getPostTypeId())
                .orElseThrow(() -> AppException.notFound("Không tìm thấy loại bài đăng"));

        Post post = new Post();
        post.setTitle(request.getTitle());
        post.setDescription(request.getDescription());
        post.setAddress(request.getAddress());
        post.setProvince(request.getProvince());
        post.setDistrict(request.getDistrict());
        post.setArea(request.getArea());
        post.setRentalPrice(request.getRentalPrice());
        post.setUser(user);
        post.setPostType(postType);
        post.setStatus(PostStatus.DRAFT);
        post.setCreatedAt(LocalDateTime.now());
        post.setUpdatedAt(LocalDateTime.now());
        post.setEndAt(null);
        post.setPushTime(null);

        Post saved = postRepository.save(post);

        List<String> imageUrls = new ArrayList<>();
        for (MultipartFile image : images) {
            String url = cloudinaryService.uploadImage(image);
            PostImage postImage = new PostImage();
            postImage.setPost(saved);
            postImage.setImageUrl(url);
            postImage.setUpdatedAt(LocalDateTime.now());
            postImageRepository.save(postImage);
            imageUrls.add(url);
        }

        auditLogService.log(
                user.getId(),
                "POST_CREATED",
                AuditLog.TargetType.POST,
                saved.getId(),
                "User #" + user.getId()
                        + " tạo tin nháp #" + saved.getId()
                        + ". Tiêu đề: \"" + saved.getTitle()
                        + "\". Loại tin: " + (postType.getName() != null ? postType.getName() : "N/A")
                        + ". Số ảnh tải lên: " + imageUrls.size() + "."
        );

        return mapToDetail(saved, imageUrls);
    }

    @Override
    @Transactional
    public PostDetailResponse updatePost(Integer userId, Integer postId,
                                         UpdatePostRequest request,
                                         List<MultipartFile> newImages) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> AppException.notFound("Không tìm thấy tin đăng"));

        if (!post.getUser().getId().equals(userId)) {
            throw AppException.forbidden("Bạn không có quyền sửa tin này");
        }

        post.setTitle(request.getTitle());
        post.setDescription(request.getDescription());
        post.setAddress(request.getAddress());
        post.setProvince(request.getProvince());
        post.setDistrict(request.getDistrict());
        post.setArea(request.getArea());
        post.setRentalPrice(request.getRentalPrice());
        post.setUpdatedAt(LocalDateTime.now());

        if (request.getDeleteImageUrls() != null && !request.getDeleteImageUrls().isEmpty()) {
            for (String url : request.getDeleteImageUrls()) {
                PostImage image = postImageRepository.findByImageUrl(url)
                        .orElseThrow(() -> AppException.notFound("Không tìm thấy ảnh: " + url));
                if (!image.getPost().getId().equals(postId)) {
                    throw AppException.forbidden("Ảnh không thuộc tin đăng này");
                }
                cloudinaryService.deleteImage(url);
                postImageRepository.delete(image);
            }
        }

        if (newImages != null && !newImages.isEmpty()) {
            int currentCount = postImageRepository.findByPostId(postId).size();
            if (currentCount + newImages.size() > 7) {
                throw AppException.badRequest("Tổng số ảnh không được vượt quá 7");
            }
            for (MultipartFile image : newImages) {
                String url = cloudinaryService.uploadImage(image);
                PostImage postImage = new PostImage();
                postImage.setPost(post);
                postImage.setImageUrl(url);
                postImage.setUpdatedAt(LocalDateTime.now());
                postImageRepository.save(postImage);
            }
        }

        Post saved = postRepository.save(post);
        List<String> imageUrls = postImageRepository.findByPostId(postId)
                .stream().map(PostImage::getImageUrl).toList();

        auditLogService.log(
                userId,
                "POST_UPDATED",
                AuditLog.TargetType.POST,
                saved.getId(),
                "User #" + userId
                        + " cập nhật nội dung tin #" + saved.getId()
                        + ". Tiêu đề hiện tại: \"" + saved.getTitle()
                        + "\". Số ảnh hiện tại: " + imageUrls.size() + "."
        );

        return mapToDetail(saved, imageUrls);
    }

    @Override
    @Transactional
    public void deletePost(Integer userId, Integer postId) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> AppException.notFound("Không tìm thấy tin đăng"));
        if (!post.getUser().getId().equals(userId)) {
            throw AppException.forbidden("Bạn không có quyền xóa tin này");
        }
        post.setStatus(PostStatus.DELETED);
        post.setUpdatedAt(LocalDateTime.now());

        Post saved = postRepository.save(post);

        auditLogService.log(
                userId,
                "POST_DELETED",
                AuditLog.TargetType.POST,
                saved.getId(),
                "User #" + userId
                        + " xóa tin #" + saved.getId()
                        + ". Tiêu đề: \"" + saved.getTitle()
                        + "\". Trạng thái mới: " + saved.getStatus() + "."
        );

    }

    @Override
    public PostPageResponse getMyPosts(Integer userId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Order.desc("createdAt")));
        Page<Post> result = postRepository.findByUserId(userId, pageable);
        return mapToPageResponse(result);
    }

    private void ensureUserCanPost(User user) {
        if (user.getStatus() == User.UserStatus.BANNED) {
            throw AppException.forbidden("Tài khoản của bạn đã bị khóa");
        }

        boolean locked = !userPenaltyRepository.findByUserIdAndTypeInAndEndDateAfter(
                user.getId(),
                List.of(UserPenalty.PenaltyType.LOCK_POST),
                LocalDateTime.now()
        ).isEmpty();

        if (locked) {
            throw AppException.forbidden("Tài khoản của bạn đang bị khóa đăng tin");
        }
    }
}