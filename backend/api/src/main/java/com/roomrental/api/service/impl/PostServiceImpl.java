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
import com.roomrental.api.util.AuthHelper;
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
    private final AuthHelper authHelper;
    private final FavoriteRepository favoriteRepository;

    // ─── Pageable sort theo priority ASC, pushTime DESC ──────────────────
    private Pageable buildSortedPageable(int page, int size) {
        Sort sort = Sort.by(Sort.Order.asc("postType.priority"),
                Sort.Order.desc("pushTime"));
        return PageRequest.of(page, size, sort);
    }

    // ─── map Post → PostSummaryResponse ──────────────────────────────────
    private PostSummaryResponse mapToSummary(Post post, List<String> imageUrls) {
        PostType pt = post.getPostType();
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
                .postTypeName(pt != null ? pt.getName() : null)
                .postTypeTitleColor(pt != null ? pt.getTitleColor() : null)
                .postTypeTitleSize(pt != null ? pt.getTitleSize() : null)
                .postTypePriority(pt != null ? pt.getPriority() : null)
                .postTypePushPrice(pt != null ? pt.getPushPrice() : null)
                .thumbnailUrl(thumbnailUrl)
                .imageUrls(imageUrls)
                .build();
    }

    // ─── map Post → PostDetailResponse ───────────────────────────────────
    private PostDetailResponse mapToDetail(Post post, List<String> imageUrls, Boolean isFavorited) {
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
                .ownerId(post.getUser() != null ? post.getUser().getId() : null)
                .createdAt(post.getCreatedAt())
                .endAt(post.getEndAt())
                .postTypeName(pt != null ? pt.getName() : null)
                .postTypeTitleColor(pt != null ? pt.getTitleColor() : null)
                .postTypeTitleSize(pt != null ? pt.getTitleSize() : null)
                .postTypePriority(pt != null ? pt.getPriority() : null)
                .imageUrls(imageUrls)
                .isFavorited(isFavorited)
                .build();
    }


    // ─── map Page<Post> → PostPageResponse ───────────────────────────────
    private PostPageResponse mapToPageResponse(Page<Post> page) {
        List<Integer> postIds = page.getContent().stream()
                .map(Post::getId).toList();

        Map<Integer, List<String>> imageMap = postIds.isEmpty()
                ? Map.of()
                : postImageRepository.findByPostIdInOrderByPostIdAndId(postIds)
                .stream()
                .collect(Collectors.groupingBy(
                        img -> img.getPost().getId(),
                        LinkedHashMap::new,
                        Collectors.mapping(
                                PostImage::getImageUrl,
                                Collectors.toList())
                ));

        List<PostSummaryResponse> posts = page.getContent().stream()
                .map(p -> mapToSummary(p, imageMap.getOrDefault(p.getId(), List.of())))
                .toList();

        return PostPageResponse.builder()
                .posts(posts)
                .currentPage(page.getNumber())
                .totalPages(page.getTotalPages())
                .totalElements(page.getTotalElements())
                .build();
    }

    // Lấy danh sách bài đăng đang hoạt động, có thể phân trang
    @Override
    public PostPageResponse getActivePosts(int page, int size) {
        Page<Post> result = postRepository.findByStatus(
                PostStatus.ACTIVE, buildSortedPageable(page, size));
        return mapToPageResponse(result);
    }

    // Tìm kiếm bài đăng theo tiêu chí, có thể phân trang
    @Override
    public PostPageResponse searchPosts(String province, String district,
                                        BigDecimal minPrice, BigDecimal maxPrice,
                                        BigDecimal minArea, BigDecimal maxArea,
                                        int page, int size) {
        // Chú ý: chỉ tìm kiếm bài đăng đang hoạt động
        Page<Post> result = postRepository.searchPosts(
                province, district, minPrice, maxPrice, minArea, maxArea,
                buildSortedPageable(page, size));
        return mapToPageResponse(result);
    }

    @Override
    @Transactional(readOnly = true)
    public List<PostLocationResponse> getActiveLocations() {
        Map<String, List<String>> districtMap = postRepository.findActiveLocations()
                .stream()
                .collect(Collectors.groupingBy(
                        PostRepository.PostLocationView::getProvince,
                        TreeMap::new,
                        Collectors.mapping(
                                PostRepository.PostLocationView::getDistrict,
                                Collectors.collectingAndThen(
                                        Collectors.toCollection(TreeSet::new),
                                        ArrayList::new
                                )
                        )
                ));

        return districtMap.entrySet()
                .stream()
                .map(entry -> PostLocationResponse.builder()
                        .province(entry.getKey())
                        .districts(entry.getValue())
                        .build())
                .toList();
    }

    // Xem thông tin chi tiết của phòng trọ, chưa bao gồm thông tin liên hệ
    @Override
    public PostDetailResponse getPostDetail(Integer postId) {
        // Lấy thông tin chi tiết của bài đăng, bao gồm thông tin người dùng và loại bài đăng
        Post post = postRepository.findDetailById(postId)
                .orElseThrow(() -> AppException.notFound("Không tìm thấy tin đăng"));

        // Lấy thông tin người dùng hiện tại, nếu có. Nếu không có (chưa đăng nhập) sẽ trả về null
        AuthHelper.CurrentUser currentUser = authHelper.getCurrentUserOrNull();

        // Nếu bài đăng không ở trạng thái ACTIVE
        // chỉ cho phép xem nếu người dùng là chủ bài đăng, đã yêu thích bài đăng này hoặc có quyền quản trị
        if (!canViewPostDetail(post, currentUser)) {
            throw AppException.notFound("Không tìm thấy tin đăng");
        }

        // Lấy danh sách URL ảnh của bài đăng
        List<String> imageUrls = postImageRepository.findByPostId(postId)
                .stream()
                .map(PostImage::getImageUrl)
                .toList();

        Boolean isFavorited = currentUser != null
                ? favoriteRepository.existsByUser_IdAndPost_Id(currentUser.id(), post.getId())
                : false;

        return mapToDetail(post, imageUrls, isFavorited);
    }

    // Xem thông tin liên hệ của phòng trọ
    @Override
    public PostContactResponse getPostContact(Integer postId) {
        // Lấy thông tin chi tiết của bài đăng, bao gồm thông tin người dùng và loại bài đăng
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> AppException.notFound("Không tìm thấy tin đăng"));

        AuthHelper.CurrentUser currentUser = authHelper.getCurrentUserOrNull();

        // Nếu bài đăng không ở trạng thái ACTIVE thì chỉ chủ tin hoặc nhân viên được xem liên hệ
        if (post.getStatus() != PostStatus.ACTIVE
                && (currentUser == null || (!isPostOwner(post, currentUser) && !isStaff(currentUser)))) {
            throw AppException.badRequest("Tin đăng không còn hiệu lực");
        }

        // Lấy thông tin người dùng là chủ bài đăng
        User owner = post.getUser();

        return PostContactResponse.builder()
                .ownerId(owner.getId())
                .ownerName(owner.getFullName())
                .ownerPhone(owner.getPhoneNumber())
                .build();
    }

    // Tạo mới bài đăng, có thể upload nhiều ảnh
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

        // Kiểm tra xem người dùng có bị cấm đăng tin không
       ensureUserCanPost(user);

        PostType postType = postTypeRepository.findById(request.getPostTypeId())
                .orElseThrow(() -> AppException.notFound("Không tìm thấy loại bài đăng"));

        // Tạo bản ghi bài đăng mới với trạng thái DRAFT
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

        // Upload ảnh lên Cloudinary và lưu URL vào PostImage
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

        // Ghi log hoạt động tạo bài đăng
        auditLogService.log(
                user.getId(),
                "POST_CREATED",
                AuditLog.TargetType.POST,
                saved.getId(),
                "Người dùng #" + user.getId()
                        + " tạo tin nháp #" + saved.getId()
                        + ". Tiêu đề: \"" + saved.getTitle()
                        + "\". Loại tin: " + (postType.getName() != null ? postType.getName() : "N/A")
                        + ". Số ảnh tải lên: " + imageUrls.size() + "."
        );

        return mapToDetail(saved, imageUrls, false);
    }

    // Cập nhật bài đăng, có thể thay thế ảnh (xóa ảnh cũ và upload ảnh mới)
    @Override
    @Transactional
    public PostDetailResponse updatePost(Integer userId, Integer postId,
                                         UpdatePostRequest request,
                                         List<MultipartFile> newImages) {

        // Lấy thông tin chi tiết của bài đăng, bao gồm thông tin người dùng và loại bài đăng
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

        // Xử lý xóa ảnh cũ nếu có
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

        // Xử lý upload ảnh mới nếu có
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

        // Lưu lại thông tin bài đăng sau khi cập nhật
        Post saved = postRepository.save(post);
        List<String> imageUrls = postImageRepository.findByPostId(postId)
                .stream().map(PostImage::getImageUrl).toList();

        auditLogService.log(
                userId,
                "POST_UPDATED",
                AuditLog.TargetType.POST,
                saved.getId(),
                "Người dùng #" + userId
                        + " cập nhật nội dung tin #" + saved.getId()
                        + ". Tiêu đề hiện tại: \"" + saved.getTitle()
                        + "\". Số ảnh hiện tại: " + imageUrls.size() + "."
        );

        return mapToDetail(saved, imageUrls, favoriteRepository.existsByUser_IdAndPost_Id(userId, postId));
    }

    // Xóa bài đăng, chỉ người dùng tạo bài đăng mới được xóa
    @Override
    @Transactional
    public void deletePost(Integer userId, Integer postId) {
        // Lấy thông tin chi tiết của bài đăng, bao gồm thông tin người dùng và loại bài đăng
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> AppException.notFound("Không tìm thấy tin đăng"));

        // Chỉ cho phép xóa nếu người dùng là chủ bài đăng
        if (!post.getUser().getId().equals(userId)) {
            throw AppException.forbidden("Bạn không có quyền xóa tin này");
        }

        // Thay vì xóa bản ghi, chỉ cần cập nhật trạng thái thành DELETED
        post.setStatus(PostStatus.DELETED);

        // Xóa ảnh trên Cloudinary và xóa bản ghi PostImage tương ứng
        post.setUpdatedAt(LocalDateTime.now());

        Post saved = postRepository.save(post);

        auditLogService.log(
                userId,
                "POST_DELETED",
                AuditLog.TargetType.POST,
                saved.getId(),
                "Người dùng #" + userId
                        + " xóa tin #" + saved.getId()
                        + ". Tiêu đề: \"" + saved.getTitle()
                        + "\". Trạng thái mới: " + saved.getStatus() + "."
        );

    }

    // Lấy danh sách bài đăng của người dùng, có phân trang
    @Override
    public PostPageResponse getMyPosts(Integer userId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Order.desc("createdAt")));
        Page<Post> result = postRepository.findByUserId(userId, pageable);
        return mapToPageResponse(result);
    }

    // Hàm tiện ích: Kiểm tra xem người dùng có bị cấm đăng tin không
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

    // Hàm tiện ích: Kiểm tra xem người dùng có quyền xem chi tiết bài đăng không
    private boolean canViewPostDetail(Post post, AuthHelper.CurrentUser currentUser) {
        // Nếu bài đăng đang hoạt động và chưa hết hạn thì cho phép xem chi tiết mà không cần kiểm tra quyền
        if (post.getStatus() == PostStatus.ACTIVE) {
            return true;
        }

        // Nếu bài dăng không ở trạng thái ACTIVE thì chỉ cho phép xem nếu người dùng là chủ bài đăng
        // hoặc đã yêu thích bài đăng này hoặc có quyền quản trị
        if (currentUser == null) {
            return false;
        }

        // Nếu người dùng là nhân viên (MODERATOR, MANAGER, ADMIN) thì cho phép xem chi tiết
        if (isStaff(currentUser)) {
            return true;
        }

        // Nếu người dùng là chủ bài đăng thì cho phép xem chi tiết
        if (isPostOwner(post, currentUser)) {
            return true;
        }

        // Nếu người dùng đã yêu thích bài đăng này thì cho phép xem chi tiết
        return isFavoritedViewablePost(post, currentUser);
    }

    // Hàm tiện ích: Kiểm tra xem bài đăng có đang hoạt động và chưa hết hạn không
    private boolean isActiveAndNotExpired(Post post) {
        // Trả về true nếu bài đăng đang hoạt động và chưa hết hạn, ngược lại trả về false
        return post.getStatus() == PostStatus.ACTIVE
                && post.getEndAt() != null
                && post.getEndAt().isAfter(LocalDateTime.now());
    }

    // Hàm tiện ích: Kiểm tra xem người dùng đã yêu thích bài đăng này chưa và bài đăng có đang ở trạng thái có thể xem chi tiết không
    private boolean isFavoritedViewablePost(Post post, AuthHelper.CurrentUser currentUser) {
        boolean viewableStatus = post.getStatus() == PostStatus.ACTIVE
                || post.getStatus() == PostStatus.EXPIRED;

        if (!viewableStatus) {
            return false;
        }

        // Trả về true nếu người dùng đã yêu thích bài đăng này, ngược lại trả về false
        return favoriteRepository.existsByUser_IdAndPost_Id(
                currentUser.id(),
                post.getId()
        );
    }

    // Hàm tiện ích: Kiểm tra xem người dùng có phải là chủ bài đăng không
    private boolean isPostOwner(Post post, AuthHelper.CurrentUser currentUser) {
        return post.getUser() != null
                && post.getUser().getId().equals(currentUser.id());
    }

    // Hàm tiện ích: Kiểm tra xem người dùng có phải là nhân viên (MODERATOR, MANAGER, ADMIN) không
    private boolean isStaff(AuthHelper.CurrentUser currentUser) {
        return switch (String.valueOf(currentUser.role())) {
            case "MODERATOR", "MANAGER", "ADMIN" -> true;
            default -> false;
        };
    }

}
