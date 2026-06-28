package com.roomrental.api.post.service.impl;

import com.roomrental.api.admin.entity.AuditLog;
import com.roomrental.api.admin.service.AuditLogService;
import com.roomrental.api.common.exception.AppException;
import com.roomrental.api.common.util.AuthHelper;
import com.roomrental.api.integration.service.CloudinaryService;
import com.roomrental.api.location.entity.District;
import com.roomrental.api.location.entity.Province;
import com.roomrental.api.location.repository.DistrictRepository;
import com.roomrental.api.location.repository.ProvinceRepository;
import com.roomrental.api.post.dto.request.CreatePostRequest;
import com.roomrental.api.post.dto.response.PostContactResponse;
import com.roomrental.api.post.dto.response.PostDetailResponse;
import com.roomrental.api.post.dto.response.PostLocationResponse;
import com.roomrental.api.post.dto.response.PostPageResponse;
import com.roomrental.api.post.dto.response.PostSummaryResponse;
import com.roomrental.api.post.dto.request.UpdatePostRequest;
import com.roomrental.api.post.entity.Post.PostStatus;
import com.roomrental.api.post.entity.Post;
import com.roomrental.api.post.entity.PostImage;
import com.roomrental.api.post.repository.FavoriteRepository;
import com.roomrental.api.post.repository.PostImageRepository;
import com.roomrental.api.post.repository.PostRepository;
import com.roomrental.api.post.service.PostService;
import com.roomrental.api.pricing.entity.PostType;
import com.roomrental.api.pricing.repository.PostTypePriceRepository;
import com.roomrental.api.pricing.repository.PostTypeRepository;
import com.roomrental.api.user.entity.Role;
import com.roomrental.api.user.entity.User;
import com.roomrental.api.user.entity.UserPenalty;
import com.roomrental.api.user.repository.UserPenaltyRepository;
import com.roomrental.api.user.repository.UserRepository;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.CompletionException;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

/**
 * Xử lý các nghiệp vụ liên quan đến bài đăng phòng trọ.
 * Bao gồm tạo, cập nhật, xóa, tìm kiếm và quản lý hình ảnh bài đăng.
 */
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
    private final ProvinceRepository provinceRepository;
    private final DistrictRepository districtRepository;
    private final PostTypePriceRepository postTypePriceRepository;

    private static final int MAX_TOTAL_IMAGES = 12;

    // ─── Pageable sort theo priority ASC, pushTime DESC ──────────────────
    private Pageable buildSortedPageable(int page, int size) {
        Sort sort = Sort.by(Sort.Order.asc("postType.priority"),
                Sort.Order.desc("pushTime"));
        return PageRequest.of(page, size, sort);
    }

    // ─── map Post → PostSummaryResponse ──────────────────────────────────
    private PostSummaryResponse mapToSummary(Post post, List<String> imageUrls) {
        PostType pt = post.getPostType();
        com.roomrental.api.user.entity.User owner = post.getUser();
        String thumbnailUrl = imageUrls.isEmpty() ? null : imageUrls.get(0);
        Province provinceRef = post.getProvinceRef();
        District districtRef = post.getDistrictRef();
        return PostSummaryResponse.builder()
                .id(post.getId())
                .title(post.getTitle())
                .description(post.getDescription())
                .province(provinceRef != null ? provinceRef.getName() : null)
                .district(districtRef != null ? districtRef.getName() : null)
                .provinceId(provinceRef != null ? provinceRef.getId() : null)
                .districtId(districtRef != null ? districtRef.getId() : null)
                .area(post.getArea())
                .rentalPrice(post.getRentalPrice())
                .status(post.getStatus() != null ? post.getStatus().name() : null)
                .endAt(post.getEndAt())
                .pushTime(post.getPushTime())
                .durationDays(post.getDurationDays())
                .postTypeName(pt != null ? pt.getName() : null)
                .postTypeTitleColor(pt != null ? pt.getTitleColor() : null)
                .postTypeTitleSize(pt != null ? pt.getTitleSize() : null)
                .postTypePriority(pt != null ? pt.getPriority() : null)
                .postTypePushPrice(pt != null ? pt.getPushPrice() : null)
                .postTypeIsUppercase(pt != null ? Boolean.TRUE.equals(pt.getIsUppercase()) : null)
                .postTypeHasRecommendTag(pt != null ? Boolean.TRUE.equals(pt.getHasRecommendTag()) : null)
                .postTypeMaxImageLimit(pt != null ? pt.getMaxImageLimit() : null)
                .prices(pt != null ? postTypePriceRepository.findByPostType_IdOrderById_DayAsc(pt.getId()).stream()
                        .map(p -> PostSummaryResponse.PostTypePriceItem.builder()
                                .days(p.getId().getDay())
                                .price(p.getPrice())
                                .build())
                        .toList() : null)
                .thumbnailUrl(thumbnailUrl)
                .imageUrls(imageUrls)
                .ownerId(owner != null ? owner.getId() : null)
                .ownerName(owner != null ? owner.getFullName() : null)
                .ownerAvatar(owner != null ? owner.getAvatar() : null)
                .build();
    }

    // ─── map Post → PostDetailResponse ───────────────────────────────────
    private PostDetailResponse mapToDetail(Post post, List<String> imageUrls, Boolean isFavorited) {
        PostType pt = post.getPostType();
        Province provinceRef = post.getProvinceRef();
        District districtRef = post.getDistrictRef();
        return PostDetailResponse.builder()
                .id(post.getId())
                .title(post.getTitle())
                .description(post.getDescription())
                .address(post.getAddress())
                .province(provinceRef != null ? provinceRef.getName() : null)
                .district(districtRef != null ? districtRef.getName() : null)
                .provinceId(provinceRef != null ? provinceRef.getId() : null)
                .districtId(districtRef != null ? districtRef.getId() : null)
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
                .postTypeIsUppercase(pt != null ? Boolean.TRUE.equals(pt.getIsUppercase()) : null)
                .postTypeHasRecommendTag(pt != null ? Boolean.TRUE.equals(pt.getHasRecommendTag()) : null)
                .postTypeMaxImageLimit(pt != null ? pt.getMaxImageLimit() : null)
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

    /**
     * Lấy danh sách bài đăng đang hoạt động, có phân trang.
     * Sắp xếp theo priority ASC, pushTime DESC.
     */
    @Override
    public PostPageResponse getActivePosts(int page, int size) {
        Page<Post> result = postRepository.findPublicActivePosts(
                PostStatus.ACTIVE, LocalDateTime.now(), buildSortedPageable(page, size));
        return mapToPageResponse(result);
    }

    /**
     * Tìm kiếm bài đăng theo tiêu chí (tỉnh, quận, giá, diện tích), có phân trang.
     * Chỉ tìm kiếm bài đăng public còn hiệu lực.
     */
    @Override
    public PostPageResponse searchPosts(Integer provinceId, Integer districtId,
                                        BigDecimal minPrice, BigDecimal maxPrice,
                                        BigDecimal minArea, BigDecimal maxArea,
                                        int page, int size) {
        // Chú ý: chỉ tìm kiếm bài đăng public còn hiệu lực
        Page<Post> result = postRepository.searchPosts(
                PostStatus.ACTIVE, LocalDateTime.now(),
                provinceId, districtId, minPrice, maxPrice, minArea, maxArea,
                buildSortedPageable(page, size));
        return mapToPageResponse(result);
    }

    /**
     * Lấy danh sách tỉnh/quận có bài đăng đang hoạt động.
     * Dùng cho bộ lọc tìm kiếm.
     */
    @Override
    @Transactional(readOnly = true)
    public List<PostLocationResponse> getActiveLocations() {
        Map<String, List<String>> districtMap = postRepository.findActiveLocations(PostStatus.ACTIVE, LocalDateTime.now())
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

    /**
     * Xem thông tin chi tiết của phòng trọ, chưa bao gồm thông tin liên hệ.
     * Nếu bài đăng không ở trạng thái ACTIVE, chỉ cho phép xem nếu
     * người dùng là chủ bài đăng, đã yêu thích bài đăng này hoặc có quyền quản trị.
     */
    @Override
    public PostDetailResponse getPostDetail(Integer postId) {
        // Lấy thông tin chi tiết của bài đăng, bao gồm thông tin người dùng và loại bài đăng
        Post post = postRepository.findDetailById(postId)
                .orElseThrow(() -> AppException.notFound("Không tìm thấy tin đăng"));

        // Lấy thông tin người dùng hiện tại, nếu có. Nếu không có (chưa đăng nhập) sẽ trả về null
        AuthHelper.CurrentUser currentUser = authHelper.getCurrentUserOrNull();

        // Nếu bài đăng không ở trạng thái ACTIVE
        // chỉ cho phép xem nếu người dùng là chủ bài đăng, đã yêu thích bài đăng này hoặc có quyền quản trị
        if (!canViewPostDetail(post, currentUser)) {
            throw AppException.notFound("Không tìm thấy tin đăng");
        }

        // Lấy danh sách URL ảnh của bài đăng
        List<String> imageUrls = postImageRepository.findByPostId(postId)
                .stream()
                .map(PostImage::getImageUrl)
                .toList();

        Boolean isFavorited = currentUser != null
                ? favoriteRepository.existsByUser_IdAndPost_Id(currentUser.id(), post.getId())
                : false;

        return mapToDetail(post, imageUrls, isFavorited);
    }

    /**
     * Xem thông tin liên hệ của phòng trọ.
     * Nếu bài đăng không còn hiệu lực thì chỉ chủ tin hoặc nhân viên được xem liên hệ.
     */
    @Override
    public PostContactResponse getPostContact(Integer postId) {
        // Lấy thông tin chi tiết của bài đăng, bao gồm thông tin người dùng và loại bài đăng
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> AppException.notFound("Không tìm thấy tin đăng"));

        AuthHelper.CurrentUser currentUser = authHelper.getCurrentUserOrNull();

        // Nếu bài đăng không còn hiệu lực thì chỉ chủ tin hoặc nhân viên được xem liên hệ
        if (!isActiveAndNotExpired(post)
                && (currentUser == null || (!isPostOwner(post, currentUser) && !isStaff(currentUser)))) {
            throw AppException.badRequest("Tin đăng không còn hiệu lực");
        }

        // Lấy thông tin người dùng là chủ bài đăng
        User owner = post.getUser();

        // Chưa đăng nhập thì chỉ ẩn số điện thoại, vẫn trả avatar + tên
        String ownerPhone = (currentUser == null) ? null : owner.getPhoneNumber();

        return PostContactResponse.builder()
                .ownerId(owner.getId())
                .ownerName(owner.getFullName())
                .ownerPhone(ownerPhone)
                .ownerAvatar(owner.getAvatar())
                .build();
    }

    /**
     * Tạo bài đăng mới với trạng thái DRAFT.
     * Upload hình ảnh lên Cloudinary và lưu vào database.
     */
    @Override
    @Transactional
    public PostDetailResponse createPost(Integer userId, CreatePostRequest request,
                                         List<MultipartFile> images) {

        if (images == null || images.isEmpty()) {
            throw AppException.badRequest("Phải tải lên ít nhất 1 ảnh");
        }
        if (images.size() > MAX_TOTAL_IMAGES) {
            throw AppException.badRequest("Không được tải lên quá " + MAX_TOTAL_IMAGES + " ảnh");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> AppException.notFound("Không tìm thấy người dùng"));

        // Kiểm tra xem người dùng có bị cấm đăng tin không
       ensureUserCanPost(user);

        PostType postType = postTypeRepository.findById(request.getPostTypeId())
                .orElseThrow(() -> AppException.notFound("Không tìm thấy loại bài đăng"));

        // maxImageLimit chỉ dùng để hiển thị trên danh sách (summary card).
        // Upload ảnh chỉ giới hạn bởi MAX_TOTAL_IMAGES, áp dụng cho mọi loại tin.
        Province province = resolveProvince(request);
        District district = resolveDistrict(request, province);

        // Tạo bản ghi bài đăng mới với trạng thái DRAFT
        Post post = new Post();
        post.setTitle(request.getTitle());
        post.setDescription(request.getDescription());
        post.setAddress(request.getAddress());
        post.setProvinceRef(province);
        post.setDistrictRef(district);
        post.setArea(request.getArea());
        post.setRentalPrice(request.getRentalPrice());
        post.setUser(user);
        post.setPostType(postType);
        post.setDurationDays(request.getDurationDays());
        post.setStatus(PostStatus.DRAFT);
        post.setCreatedAt(LocalDateTime.now());
        post.setUpdatedAt(LocalDateTime.now());
        post.setEndAt(null);
        post.setPushTime(null);

        Post saved = postRepository.save(post);

        List<String> imageUrls = uploadPostImages(images);
        for (String url : imageUrls) {
            PostImage postImage = new PostImage();
            postImage.setPost(saved);
            postImage.setImageUrl(url);
            postImage.setUpdatedAt(LocalDateTime.now());
            postImageRepository.save(postImage);
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

    /**
     * Cập nhật bài đăng, có thể thay thế ảnh (xóa ảnh cũ và upload ảnh mới).
     * Chỉ chủ bài đăng mới được phép cập nhật.
     */
    @Override
    @Transactional
    public PostDetailResponse updatePost(Integer userId, Integer postId,
                                         UpdatePostRequest request,
                                         List<MultipartFile> newImages) {

        // Lấy thông tin chi tiết của bài đăng, bao gồm thông tin người dùng và loại bài đăng
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> AppException.notFound("Không tìm thấy tin đăng"));

        if (!post.getUser().getId().equals(userId)) {
            throw AppException.forbidden("Bạn không có quyền sửa tin này");
        }

        post.setTitle(request.getTitle());
        post.setDescription(request.getDescription());
        post.setAddress(request.getAddress());
        Province province = resolveProvinceFromUpdate(request);
        District district = resolveDistrictFromUpdate(request, province);
        post.setProvinceRef(province);
        post.setDistrictRef(district);
        post.setArea(request.getArea());
        post.setRentalPrice(request.getRentalPrice());
        post.setUpdatedAt(LocalDateTime.now());

        if (request.getPostTypeId() != null) {
            PostType updatePostType = postTypeRepository.findById(request.getPostTypeId())
                    .orElseThrow(() -> AppException.notFound("Không tìm thấy loại bài đăng"));
            post.setPostType(updatePostType);
        }
        if (request.getDurationDays() != null) {
            post.setDurationDays(request.getDurationDays());
        }

        // Xử lý xóa ảnh cũ nếu có
        if (request.getDeleteImageUrls() != null && !request.getDeleteImageUrls().isEmpty()) {
            for (String url : request.getDeleteImageUrls()) {
                PostImage image = postImageRepository
                        .findByPostIdAndImageUrl(postId, url)
                        .orElseThrow(() -> AppException.notFound("Không tìm thấy ảnh: " + url));
                try {
                    cloudinaryService.deleteImage(url);
                    // Nếu ảnh đã bị xóa khỏi Cloudinary trước đó, vẫn tiếp tục xóa DB record
                } catch (Exception ignored) { }
                postImageRepository.delete(image);
            }
        }

        // Xử lý upload ảnh mới nếu có
        if (newImages != null && !newImages.isEmpty()) {
            int currentCount = postImageRepository.findByPostId(postId).size();
            // maxImageLimit chỉ dùng để hiển thị trên danh sách (summary card).
            // Tổng số ảnh lưu trữ chỉ giới hạn bởi MAX_TOTAL_IMAGES, áp dụng cho mọi loại tin.
            if (currentCount + newImages.size() > MAX_TOTAL_IMAGES) {
                throw AppException.badRequest("Tổng số ảnh không được vượt quá " + MAX_TOTAL_IMAGES);
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

    /**
     * Xóa bài đăng (soft delete - chỉ cập nhật trạng thái thành DELETED).
     * Chỉ chủ bài đăng mới được phép xóa.
     */
    @Override
    @Transactional
    public void deletePost(Integer userId, Integer postId) {
        // Lấy thông tin chi tiết của bài đăng, bao gồm thông tin người dùng và loại bài đăng
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

    /**
     * Bật/tắt hiển thị bài đăng (ACTIVE <-> HIDDEN).
     * Chỉ chủ bài đăng mới được phép thực hiện.
     */
    @Override
    @Transactional
    public void toggleVisibility(Integer userId, Integer postId) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> AppException.notFound("Không tìm thấy tin đăng"));

        if (!post.getUser().getId().equals(userId)) {
            throw AppException.forbidden("Bạn không có quyền thực hiện thao tác này");
        }

        PostStatus current = post.getStatus();
        PostStatus next;
        if (current == PostStatus.HIDDEN) {
            next = PostStatus.ACTIVE;
        } else if (current == PostStatus.ACTIVE) {
            next = PostStatus.HIDDEN;
        } else {
            throw AppException.badRequest("Chỉ có thể ẩn/hiện tin đang hoạt động");
        }

        post.setStatus(next);
        post.setUpdatedAt(LocalDateTime.now());
        Post saved = postRepository.save(post);

        String action = (next == PostStatus.HIDDEN) ? "POST_HIDDEN" : "POST_VISIBLE";
        String msg = (next == PostStatus.HIDDEN)
                ? "Người dùng #" + userId + " ẩn tin #" + saved.getId()
                : "Người dùng #" + userId + " hiện tin #" + saved.getId();
        auditLogService.log(userId, action, AuditLog.TargetType.POST, saved.getId(), msg + ". Trạng thái mới: " + next + ".");
    }

    /**
     * Lấy danh sách bài đăng của người dùng, có phân trang.
     */
    @Override
    public PostPageResponse getMyPosts(Integer userId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Order.desc("createdAt")));
        Page<Post> result = postRepository.findByUserId(userId, pageable);
        return mapToPageResponse(result);
    }

    // Hàm tiện ích: Kiểm tra xem người dùng có bị cấm đăng tin không
    private void ensureUserCanPost(User user) {
        if (user.getStatus() == User.UserStatus.BANNED) {
            throw AppException.forbidden("Tài khoản của bạn đã bị khóa");
        }

        boolean locked = !userPenaltyRepository.findByUserIdAndTypeInAndEndDateAfterAndIsActiveTrue(
                user.getId(),
                List.of(UserPenalty.PenaltyType.LOCK_POST),
                LocalDateTime.now()
        ).isEmpty();

        if (locked) {
            throw AppException.forbidden("Tài khoản của bạn đang bị khóa đăng tin");
        }
    }

    private List<String> uploadPostImages(List<MultipartFile> images) {
        List<CompletableFuture<String>> uploadTasks = images.stream()
                .map(image -> CompletableFuture.supplyAsync(() -> cloudinaryService.uploadImage(image)))
                .toList();

        try {
            CompletableFuture.allOf(uploadTasks.toArray(CompletableFuture[]::new)).join();
            return uploadTasks.stream()
                    .map(CompletableFuture::join)
                    .toList();
        } catch (CompletionException ex) {
            Throwable cause = ex.getCause() != null ? ex.getCause() : ex;
            throw new RuntimeException("Không thể upload ảnh bài đăng: " + cause.getMessage(), cause);
        }
    }

    // Hàm tiện ích: Kiểm tra xem người dùng có quyền xem chi tiết bài đăng không
    // Resolve province: ưu tiên provinceId, fallback tìm theo tên
    // Resolve province theo ID (bắt buộc)
    private Province resolveProvince(CreatePostRequest request) {
        if (request.getProvinceId() == null) {
            throw AppException.badRequest("Vui lòng chọn tỉnh/thành");
        }
        return provinceRepository.findById(request.getProvinceId())
                .orElseThrow(() -> AppException.badRequest("Tỉnh/thành không hợp lệ"));
    }

    private Province resolveProvinceFromUpdate(UpdatePostRequest request) {
        if (request.getProvinceId() == null) {
            throw AppException.badRequest("Vui lòng chọn tỉnh/thành");
        }
        return provinceRepository.findById(request.getProvinceId())
                .orElseThrow(() -> AppException.badRequest("Tỉnh/thành không hợp lệ"));
    }

    private District resolveDistrictFromUpdate(UpdatePostRequest request, Province province) {
        if (request.getDistrictId() == null) {
            throw AppException.badRequest("Vui lòng chọn quận/huyện");
        }
        District district = districtRepository.findById(request.getDistrictId())
                .orElseThrow(() -> AppException.badRequest("Quận/huyện không hợp lệ"));
        if (province != null && !province.getId().equals(district.getProvinceId())) {
            throw AppException.badRequest("Quận/huyện không thuộc tỉnh/thành đã chọn");
        }
        return district;
    }

    private District resolveDistrict(CreatePostRequest request, Province province) {
        if (request.getDistrictId() == null) {
            throw AppException.badRequest("Vui lòng chọn quận/huyện");
        }
        District district = districtRepository.findById(request.getDistrictId())
                .orElseThrow(() -> AppException.badRequest("Quận/huyện không hợp lệ"));
        if (province != null && !province.getId().equals(district.getProvinceId())) {
            throw AppException.badRequest("Quận/huyện không thuộc tỉnh/thành đã chọn");
        }
        return district;
    }


    private boolean canViewPostDetail(Post post, AuthHelper.CurrentUser currentUser) {
        // Nếu bài đăng đang hoạt động và chưa hết hạn thì cho phép xem chi tiết mà không cần kiểm tra quyền
        if (isActiveAndNotExpired(post)) {
            return true;
        }

        // Nếu bài dăng không ở trạng thái ACTIVE thì chỉ cho phép xem nếu người dùng là chủ bài đăng
        // hoặc đã yêu thích bài đăng này hoặc có quyền quản trị
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

    // Hàm tiện ích: Kiểm tra xem bài đăng có đang hoạt động và chưa hết hạn không
    private boolean isActiveAndNotExpired(Post post) {
        // Trả về true nếu bài đăng đang hoạt động và chưa hết hạn, ngược lại trả về false
        return post.getStatus() == PostStatus.ACTIVE
                && post.getEndAt() != null
                && post.getEndAt().isAfter(LocalDateTime.now());
    }

    // Hàm tiện ích: Kiểm tra xem người dùng đã yêu thích bài đăng này chưa và bài đăng có đang ở trạng thái có thể xem chi tiết không
    private boolean isFavoritedViewablePost(Post post, AuthHelper.CurrentUser currentUser) {
        boolean viewableStatus = post.getStatus() == PostStatus.ACTIVE
                || post.getStatus() == PostStatus.EXPIRED;

        if (!viewableStatus) {
            return false;
        }

        // Trả về true nếu người dùng đã yêu thích bài đăng này, ngược lại trả về false
        return favoriteRepository.existsByUser_IdAndPost_Id(
                currentUser.id(),
                post.getId()
        );
    }

    // Hàm tiện ích: Kiểm tra xem người dùng có phải là chủ bài đăng không
    private boolean isPostOwner(Post post, AuthHelper.CurrentUser currentUser) {
        return post.getUser() != null
                && post.getUser().getId().equals(currentUser.id());
    }

    // Hàm tiện ích: Kiểm tra xem người dùng có phải là nhân viên (MODERATOR, MANAGER, ADMIN) không
    private boolean isStaff(AuthHelper.CurrentUser currentUser) {
        return switch (String.valueOf(currentUser.role())) {
            case "MODERATOR", "MANAGER", "ADMIN" -> true;
            default -> false;
        };
    }

}
