package com.roomrental.api.moderation.service.impl;

import com.roomrental.api.admin.dto.response.AdminUserPageResponse;
import com.roomrental.api.admin.dto.response.AdminUserResponse;
import com.roomrental.api.admin.entity.AuditLog;
import com.roomrental.api.admin.service.AuditLogService;
import com.roomrental.api.common.exception.AppException;
import com.roomrental.api.moderation.dto.request.BanUserRequest;
import com.roomrental.api.moderation.dto.response.ModerationPostPageResponse;
import com.roomrental.api.moderation.dto.response.ModerationPostSummaryResponse;
import com.roomrental.api.moderation.entity.ModerationLog;
import com.roomrental.api.moderation.service.ModerationLogService;
import com.roomrental.api.moderation.service.ModerationService;
import com.roomrental.api.notification.entity.Notification;
import com.roomrental.api.notification.service.NotificationService;
import static com.roomrental.api.notification.service.impl.NotificationServiceImpl.formatMoney;
import com.roomrental.api.payment.entity.Payment;
import com.roomrental.api.payment.repository.PaymentRepository;
import com.roomrental.api.post.dto.response.PostDetailResponse;
import com.roomrental.api.post.entity.Post.PostStatus;
import com.roomrental.api.post.entity.Post;
import com.roomrental.api.post.entity.PostImage;
import com.roomrental.api.post.repository.PostImageRepository;
import com.roomrental.api.post.repository.PostRepository;
import com.roomrental.api.pricing.entity.PostType;
import com.roomrental.api.pricing.service.MembershipService;
import com.roomrental.api.user.entity.Role;
import com.roomrental.api.user.entity.User;
import com.roomrental.api.user.entity.UserPenalty;
import com.roomrental.api.user.repository.UserPenaltyRepository;
import com.roomrental.api.user.repository.UserRepository;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Xử lý các nghiệp vụ kiểm duyệt bài đăng và người dùng.
 * Bao gồm duyệt/từ chối bài đăng, ban user, và quản lý penalty.
 */
@Service
@RequiredArgsConstructor
public class ModerationServiceImpl implements ModerationService {

    private final PostRepository postRepository;
    private final PostImageRepository postImageRepository;
    private final PaymentRepository paymentRepository;
    private final UserRepository userRepository;
    private final ModerationLogService moderationLogService;
    private final AuditLogService auditLogService;
    private final NotificationService notificationService;
    private final UserPenaltyRepository userPenaltyRepository;
    private final MembershipService membershipService;

    /**
     * Lấy danh sách bài đăng cần kiểm duyệt với bộ lọc.
     */
    @Override
    @Transactional(readOnly = true)
    public ModerationPostPageResponse getPendingPosts(Post.PostStatus status, Integer postTypeId, Integer keyword, int page, int size) {
        Page<Post> result = postRepository.findModerationQueue(
                status,
                postTypeId,
                keyword,
                PageRequest.of(page, size)
        );

        return ModerationPostPageResponse.builder()
                .posts(result.getContent().stream().map(this::mapSummary).toList())
                .currentPage(result.getNumber())
                .totalPages(result.getTotalPages())
                .totalElements(result.getTotalElements())
                .build();
    }

    /**
     * Lấy thông tin chi tiết bài đăng để kiểm duyệt.
     */
    @Override
    @Transactional(readOnly = true)
    public PostDetailResponse getPostDetail(Integer postId) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> AppException.notFound("Không tìm thấy tin đăng"));
        return mapDetail(post);
    }

    /**
     * Duyệt bài đăng.
     * Chuyển trạng thái sang ACTIVE, tính ngày hết hạn, cập nhật totalSpent của chủ tin.
     */
    @Override
    @Transactional
    public PostDetailResponse approvePost(Integer moderatorId, Integer postId) {
        Post post = getPendingPost(postId);

        if (post.getDurationDays() == null || post.getDurationDays() <= 0) {
            throw AppException.badRequest("Tin chưa có thời hạn đăng hợp lệ");
        }

        LocalDateTime now = LocalDateTime.now();
        post.setStatus(Post.PostStatus.ACTIVE);
        post.setEndAt(now.plusDays(post.getDurationDays()));
        post.setPushTime(now);
        post.setUpdatedAt(now);

        Payment originalPayment = paymentRepository
                .findTopByPostIdAndPaymentTypeOrderByCreatedAtDesc(postId, Payment.PaymentType.POST_PAYMENT)
                .orElseThrow(() -> AppException.badRequest("Không tìm thấy giao dịch thanh toán của tin này"));

        User owner = userRepository.findByIdForPayment(post.getUser().getId())
                .orElseThrow(() -> AppException.notFound("Không tìm thấy chủ tin"));

        BigDecimal finalFee = originalPayment.getFinalFee();
        if (finalFee == null || finalFee.compareTo(BigDecimal.ZERO) <= 0) {
            throw AppException.badRequest("Số tiền thanh toán không hợp lệ");
        }

        owner.setTotalSpent(nullSafe(owner.getTotalSpent()).add(finalFee));
        membershipService.refreshUserMembership(owner);

        Post saved = postRepository.save(post);

        moderationLogService.log(moderatorId, ModerationLog.ModerationAction.ACCEPT_POST,
                ModerationLog.TargetType.POST, saved.getId(), "Duyệt tin đăng");

        auditLogService.log(moderatorId, "APPROVE_POST", AuditLog.TargetType.POST,
                saved.getId(), "Tin được duyệt và hiển thị đến " + saved.getEndAt());

        notificationService.notifyUser(saved.getUser().getId(), Notification.NotificationType.POST_INFORMATION,
                "Tin \"" + saved.getTitle() + "\" đã được duyệt và bắt đầu hiển thị.");

        return mapDetail(saved);
    }

    /**
     * Từ chối bài đăng và hoàn tiền 100% cho người dùng.
     */
    @Override
    @Transactional
    public PostDetailResponse rejectPost(Integer moderatorId, Integer postId, String reason) {
        Post post = getPendingPost(postId);
        User owner = userRepository.findByIdForPayment(post.getUser().getId())
                .orElseThrow(() -> AppException.notFound("Không tìm thấy chủ tin"));

        Payment originalPayment = paymentRepository
                .findTopByPostIdAndPaymentTypeOrderByCreatedAtDesc(postId, Payment.PaymentType.POST_PAYMENT)
                .orElseThrow(() -> AppException.badRequest("Không tìm thấy giao dịch thanh toán của tin này"));

        BigDecimal refundAmount = originalPayment.getFinalFee();
        if (refundAmount == null || refundAmount.compareTo(BigDecimal.ZERO) <= 0) {
            throw AppException.badRequest("Số tiền hoàn không hợp lệ");
        }

        BigDecimal openingBalance = nullSafe(owner.getAccountBalance());
        BigDecimal closingBalance = openingBalance.add(refundAmount);
        owner.setAccountBalance(closingBalance);

        LocalDateTime now = LocalDateTime.now();
        post.setStatus(Post.PostStatus.REJECTED);
        post.setUpdatedAt(now);

        Payment refund = new Payment();
        refund.setUser(owner);
        refund.setPost(post);
        refund.setPaymentType(Payment.PaymentType.REFUND);
        refund.setDays(post.getDurationDays());
        refund.setBaseFee(refundAmount);
        refund.setTax(BigDecimal.ZERO);
        refund.setDiscountPercent(0);
        refund.setFinalFee(refundAmount);
        refund.setOpeningBalance(openingBalance);
        refund.setClosingBalance(closingBalance);
        refund.setCreatedAt(now);
        paymentRepository.save(refund);

        Post saved = postRepository.save(post);

        moderationLogService.log(moderatorId, ModerationLog.ModerationAction.REJECT_POST,
                ModerationLog.TargetType.POST, saved.getId(), reason);

        auditLogService.log(moderatorId, "REJECT_POST_AND_REFUND", AuditLog.TargetType.TRANSACTION,
                refund.getId(), "Từ chối tin #" + saved.getId() + ", hoàn tiền 100%. Lý do: " + reason);

        notificationService.notifyUser(owner.getId(), Notification.NotificationType.POST_INFORMATION,
                "Tin \"" + saved.getTitle() + "\" bị từ chối. Lý do: "
                        + reason + ". Hệ thống đã hoàn " + formatMoney(refundAmount) + " vào ví của bạn.");

        return mapDetail(saved);
    }

    @Override
    @Transactional
    public PostDetailResponse hidePost(Integer moderatorId, Integer postId, String reason) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> AppException.notFound("Không tìm thấy tin đăng"));

        if (post.getStatus() != Post.PostStatus.ACTIVE && post.getStatus() != Post.PostStatus.EXPIRED) {
            throw AppException.badRequest("Chỉ có thể ẩn tin đang hiển thị hoặc hết hạn");
        }

        User owner = post.getUser();
        LocalDateTime now = LocalDateTime.now();
        post.setStatus(Post.PostStatus.HIDDEN);
        post.setUpdatedAt(now);

        Post saved = postRepository.save(post);

        moderationLogService.log(moderatorId, ModerationLog.ModerationAction.HIDDEN_POST,
                ModerationLog.TargetType.POST, saved.getId(), reason);

        auditLogService.log(moderatorId, "HIDE_POST", AuditLog.TargetType.POST,
                saved.getId(), reason);

        notificationService.notifyUser(owner.getId(), Notification.NotificationType.POST_INFORMATION,
                "Tin \"" + saved.getTitle() + "\" đã bị ẩn. Lý do: " + reason
                        + ". Vui lòng liên hệ bộ phận kiểm duyệt nếu cần.");

        return mapDetail(saved);
    }

    @Override
    @Transactional
    public PostDetailResponse unhidePost(Integer moderatorId, Integer postId) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> AppException.notFound("Không tìm thấy tin đăng"));

        if (post.getStatus() != Post.PostStatus.HIDDEN) {
            throw AppException.badRequest("Chỉ có thể hiện tin đang bị ẩn");
        }

        User owner = post.getUser();
        LocalDateTime now = LocalDateTime.now();
        post.setStatus(Post.PostStatus.ACTIVE);
        post.setUpdatedAt(now);

        Post saved = postRepository.save(post);

        moderationLogService.log(moderatorId, ModerationLog.ModerationAction.UNHIDDEN_POST,
                ModerationLog.TargetType.POST, saved.getId(), "Hiện lại tin đăng");

        auditLogService.log(moderatorId, "UNHIDE_POST", AuditLog.TargetType.POST,
                saved.getId(), "Tin được hiện lại sau khi ẩn");

        notificationService.notifyUser(owner.getId(), Notification.NotificationType.POST_INFORMATION,
                "Tin \"" + saved.getTitle() + "\" đã được hiển thị trở lại.");

        return mapDetail(saved);
    }

    @Override
    @Transactional
    public PostDetailResponse removePost(Integer moderatorId, Integer postId, String reason) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> AppException.notFound("Không tìm thấy tin đăng"));

        if (post.getStatus() != Post.PostStatus.ACTIVE
                && post.getStatus() != Post.PostStatus.HIDDEN
                && post.getStatus() != Post.PostStatus.EXPIRED) {
            throw AppException.badRequest("Không thể xóa tin ở trạng thái này");
        }

        User owner = post.getUser();
        LocalDateTime now = LocalDateTime.now();
        post.setStatus(Post.PostStatus.DELETED);
        post.setUpdatedAt(now);

        Post saved = postRepository.save(post);

        moderationLogService.log(moderatorId, ModerationLog.ModerationAction.REMOVE_POST,
                ModerationLog.TargetType.POST, saved.getId(), reason);

        auditLogService.log(moderatorId, "REMOVE_POST", AuditLog.TargetType.POST,
                saved.getId(), reason);

        notificationService.notifyUser(owner.getId(), Notification.NotificationType.POST_INFORMATION,
                "Tin \"" + saved.getTitle() + "\" đã bị xóa. Lý do: " + reason
                        + ". Vui lòng liên hệ bộ phận kiểm duyệt nếu cần.");

        return mapDetail(saved);
    }

    private Post getPendingPost(Integer postId) {
        Post post = postRepository.findByIdForModeration(postId)
                .orElseThrow(() -> AppException.notFound("Không tìm thấy tin đăng"));

        if (post.getStatus() != Post.PostStatus.PENDING) {
            throw AppException.badRequest("Chỉ có thể xử lý tin đang chờ duyệt");
        }

        return post;
    }

    private ModerationPostSummaryResponse mapSummary(Post post) {
        User owner = post.getUser();
        PostType postType = post.getPostType();

        return ModerationPostSummaryResponse.builder()
                .id(post.getId())
                .title(post.getTitle())
                .rentalPrice(post.getRentalPrice())
                .area(post.getArea())
                .province(post.getProvinceRef() != null ? post.getProvinceRef().getName() : null)
                .district(post.getDistrictRef() != null ? post.getDistrictRef().getName() : null)
                .postTypeName(postType != null ? postType.getName() : null)
                .postTypeTitleColor(postType != null ? postType.getTitleColor() : null)
                .postTypeTitleSize(postType != null ? postType.getTitleSize() : null)
                .postTypePriority(postType != null ? postType.getPriority() : null)
                .ownerName(owner != null ? owner.getFullName() : null)
                .ownerAvatar(owner != null ? owner.getAvatar() : null)
                .createdAt(post.getCreatedAt())
                .status(post.getStatus() != null ? post.getStatus().name() : null)
                .imageCount(postImageRepository.countByPostId(post.getId()))
                .build();
    }

    private PostDetailResponse mapDetail(Post post) {
        PostType postType = post.getPostType();
        User owner = post.getUser();

        return PostDetailResponse.builder()
                .id(post.getId())
                .title(post.getTitle())
                .description(post.getDescription())
                .address(post.getAddress())
                .province(post.getProvinceRef() != null ? post.getProvinceRef().getName() : null)
                .district(post.getDistrictRef() != null ? post.getDistrictRef().getName() : null)
                .area(post.getArea())
                .rentalPrice(post.getRentalPrice())
                .status(post.getStatus())
                .ownerId(owner != null ? owner.getId() : null)
                .ownerName(owner != null ? owner.getFullName() : null)
                .ownerEmail(owner != null ? owner.getEmail() : null)
                .ownerPhoneNumber(owner != null ? owner.getPhoneNumber() : null)
                .ownerAvatar(owner != null ? owner.getAvatar() : null)
                .createdAt(post.getCreatedAt())
                .endAt(post.getEndAt())
                .postTypeName(postType != null ? postType.getName() : null)
                .postTypeTitleColor(postType != null ? postType.getTitleColor() : null)
                .postTypeTitleSize(postType != null ? postType.getTitleSize() : null)
                .postTypePriority(postType != null ? postType.getPriority() : null)
                .imageUrls(postImageRepository.findByPostId(post.getId()).stream()
                        .map(PostImage::getImageUrl)
                        .toList())
                .build();
    }

    private BigDecimal nullSafe(BigDecimal value) {
        return value != null ? value : BigDecimal.ZERO;
    }

    @Override
    @Transactional(readOnly = true)
    public AdminUserPageResponse getNormalUsers(User.UserStatus status, String keyword, int page, int size) {
        String searchKeyword = keyword != null && !keyword.isBlank()
                ? keyword.trim()
                : null;

        Page<User> result = userRepository.searchAdminUsers(
                "USER",
                status,
                searchKeyword,
                PageRequest.of(page, size, Sort.by(Sort.Order.desc("createdAt")))
        );

        return AdminUserPageResponse.builder()
                .users(result.getContent().stream().map(this::mapUserResponse).toList())
                .currentPage(result.getNumber())
                .totalPages(result.getTotalPages())
                .totalElements(result.getTotalElements())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public AdminUserPageResponse getUserDetail(Integer userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> AppException.notFound("Không tìm thấy người dùng"));

        AdminUserResponse response = mapUserResponseWithPenalties(user);

        return AdminUserPageResponse.builder()
                .users(List.of(response))
                .currentPage(0)
                .totalPages(1)
                .totalElements(1)
                .build();
    }

    @Override
    @Transactional
    public void banUser(Integer moderatorId, Integer userId, BanUserRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> AppException.notFound("Không tìm thấy người dùng"));

        if (user.getRole() != null && !"USER".equals(user.getRole().getName())) {
            throw AppException.badRequest("Không thể xử lý tài khoản nhân sự");
        }

        LocalDateTime now = LocalDateTime.now();

        if (request.getDurationDays() != null && request.getDurationDays() <= 0) {
            throw AppException.badRequest("Số ngày xử lý phải lớn hơn 0");
        }

        if (request.getType() == UserPenalty.PenaltyType.LOCK_POST
                && request.getDurationDays() == null) {
            throw AppException.badRequest("Khóa đăng tin cần số ngày hợp lệ");
        }

        UserPenalty penalty = new UserPenalty();
        penalty.setUser(user);
        penalty.setType(request.getType());
        penalty.setReason(request.getReason());
        penalty.setStartDate(now);
        penalty.setCreatedAt(now);
        penalty.setIsActive(true);

        if (request.getType() == UserPenalty.PenaltyType.LOCK_POST) {
            penalty.setEndDate(now.plusDays(request.getDurationDays()));
        }

        if (request.getType() == UserPenalty.PenaltyType.BAN_ACCOUNT) {
            user.setStatus(User.UserStatus.BANNED);
            penalty.setEndDate(request.getDurationDays() != null ? now.plusDays(request.getDurationDays()) : null);
        }

        userPenaltyRepository.save(penalty);

        moderationLogService.log(
                moderatorId,
                mapPenaltyAction(request.getType()),
                ModerationLog.TargetType.USER,
                user.getId(),
                request.getReason()
        );

        auditLogService.log(
                moderatorId,
                "BAN_USER_" + request.getType().name(),
                AuditLog.TargetType.USER,
                user.getId(),
                request.getReason()
        );

        notificationService.notifyUser(
                user.getId(),
                Notification.NotificationType.SYSTEM_INFORMATION,
                "Tài khoản của bạn bị xử lý: " + request.getType().name()
                        + ". Lý do: " + request.getReason()
        );
    }

    @Override
    @Transactional
    public void clearUserPenalties(Integer moderatorId, Integer userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> AppException.notFound("Không tìm thấy người dùng"));

        if (user.getRole() != null && !"USER".equals(user.getRole().getName())) {
            throw AppException.badRequest("Không thể xử lý tài khoản nhân sự");
        }

        LocalDateTime now = LocalDateTime.now();
        List<UserPenalty> activePenalties = userPenaltyRepository.findActiveByUserId(userId, now);
        boolean wasBanned = user.getStatus() == User.UserStatus.BANNED;

        if (activePenalties.isEmpty() && !wasBanned) {
            return;
        }

        // Mark penalties as inactive instead of deleting
        if (!activePenalties.isEmpty()) {
            activePenalties.forEach(p -> p.setIsActive(false));
            userPenaltyRepository.saveAll(activePenalties);
        }

        if (wasBanned) {
            user.setStatus(User.UserStatus.ACTIVE);
        }

        String reason = "Gỡ " + activePenalties.size() + " hình phạt hiện hữu của tài khoản";

        auditLogService.log(
                moderatorId,
                "CLEAR_USER_PENALTIES",
                AuditLog.TargetType.USER,
                user.getId(),
                reason
        );

        notificationService.notifyUser(
                user.getId(),
                Notification.NotificationType.SYSTEM_INFORMATION,
                "Các hình phạt hiện tại trên tài khoản của bạn đã được gỡ."
        );
    }

    private AdminUserResponse mapUserResponse(User user) {
        return AdminUserResponse.builder()
                .id(user.getId())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .phoneNumber(user.getPhoneNumber())
                .status(user.getStatus() != null ? user.getStatus().name() : null)
                .role(user.getRole() != null ? user.getRole().getName() : null)
                .avatar(user.getAvatar())
                .createdAt(user.getCreatedAt())
                .activePenalties(userPenaltyRepository.findActiveByUserId(user.getId(), LocalDateTime.now()).stream()
                        .map(this::mapActivePenalty)
                        .toList())
                .build();
    }

    private AdminUserResponse mapUserResponseWithPenalties(User user) {
        List<UserPenalty> allPenalties = userPenaltyRepository.findByUserIdOrderByCreatedAtDesc(user.getId());

        return AdminUserResponse.builder()
                .id(user.getId())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .phoneNumber(user.getPhoneNumber())
                .status(user.getStatus() != null ? user.getStatus().name() : null)
                .role(user.getRole() != null ? user.getRole().getName() : null)
                .avatar(user.getAvatar())
                .createdAt(user.getCreatedAt())
                .activePenalties(allPenalties.stream()
                        .map(this::mapActivePenalty)
                        .toList())
                .build();
    }

    private AdminUserResponse.ActivePenaltyResponse mapActivePenalty(UserPenalty penalty) {
        return AdminUserResponse.ActivePenaltyResponse.builder()
                .id(penalty.getId())
                .type(penalty.getType() != null ? penalty.getType().name() : null)
                .reason(penalty.getReason())
                .startDate(penalty.getStartDate())
                .endDate(penalty.getEndDate())
                .isActive(penalty.getIsActive())
                .createdAt(penalty.getCreatedAt())
                .build();
    }

    private ModerationLog.ModerationAction mapPenaltyAction(UserPenalty.PenaltyType type) {
        return switch (type) {
            case WARNING -> ModerationLog.ModerationAction.WARNING;
            case LOCK_POST -> ModerationLog.ModerationAction.LOCK_POST;
            case BAN_ACCOUNT -> ModerationLog.ModerationAction.BAN_ACCOUNT;
        };
    }
}