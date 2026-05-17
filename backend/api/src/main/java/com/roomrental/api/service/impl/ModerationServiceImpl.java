package com.roomrental.api.service.impl;

import com.roomrental.api.dto.request.moderation.BanUserRequest;
import com.roomrental.api.dto.response.moderation.ModerationPostPageResponse;
import com.roomrental.api.dto.response.moderation.ModerationPostSummaryResponse;
import com.roomrental.api.dto.response.post.PostDetailResponse;
import com.roomrental.api.entity.*;
import com.roomrental.api.exception.AppException;
import com.roomrental.api.repository.*;
import com.roomrental.api.service.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;

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

    @Override
    @Transactional(readOnly = true)
    public ModerationPostPageResponse getPendingPosts(Integer postTypeId, int page, int size) {
        Sort sort = postTypeId == null
                ? Sort.by(Sort.Order.asc("postType.priority"), Sort.Order.asc("createdAt"))
                : Sort.by(Sort.Order.asc("createdAt"));

        Page<Post> result = postRepository.findModerationQueue(
                Post.PostStatus.PENDING,
                postTypeId,
                PageRequest.of(page, size, sort)
        );

        return ModerationPostPageResponse.builder()
                .posts(result.getContent().stream().map(this::mapSummary).toList())
                .currentPage(result.getNumber())
                .totalPages(result.getTotalPages())
                .totalElements(result.getTotalElements())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public PostDetailResponse getPostDetail(Integer postId) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> AppException.notFound("Không tìm thấy tin đăng"));
        return mapDetail(post);
    }

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

        Post saved = postRepository.save(post);

        moderationLogService.log(moderatorId, ModerationLog.ModerationAction.ACCEPT_POST,
                ModerationLog.TargetType.POST, saved.getId(), "Duyệt tin đăng");

        auditLogService.log(moderatorId, "APPROVE_POST", AuditLog.TargetType.POST,
                saved.getId(), "Tin được duyệt và hiển thị đến " + saved.getEndAt());

        notificationService.notifyUser(saved.getUser().getId(), Notification.NotificationType.POST_INFORMATION,
                "Tin \"" + saved.getTitle() + "\" đã được duyệt và bắt đầu hiển thị.");

        return mapDetail(saved);
    }

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
                        + reason + ". Hệ thống đã hoàn " + refundAmount + "đ vào ví của bạn.");

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
                .province(post.getProvince())
                .district(post.getDistrict())
                .postTypeName(postType != null ? postType.getName() : null)
                .postTypeTitleColor(postType != null ? postType.getTitleColor() : null)
                .postTypeTitleSize(postType != null ? postType.getTitleSize() : null)
                .postTypePriority(postType != null ? postType.getPriority() : null)
                .ownerName(owner != null ? owner.getFullName() : null)
                .createdAt(post.getCreatedAt())
                .build();
    }

    private PostDetailResponse mapDetail(Post post) {
        PostType postType = post.getPostType();

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
    @Transactional
    public void banUser(Integer moderatorId, Integer userId, BanUserRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> AppException.notFound("Không tìm thấy người dùng"));

        if (user.getRole() != null && !"USER".equals(user.getRole().getName())) {
            throw AppException.badRequest("Không thể xử lý tài khoản nhân sự");
        }

        LocalDateTime now = LocalDateTime.now();

        if (request.getType() == UserPenalty.PenaltyType.LOCK_POST
                && (request.getDurationDays() == null || request.getDurationDays() <= 0)) {
            throw AppException.badRequest("Khóa đăng tin cần số ngày hợp lệ");
        }

        UserPenalty penalty = new UserPenalty();
        penalty.setUser(user);
        penalty.setType(request.getType());
        penalty.setReason(request.getReason());
        penalty.setStartDate(now);
        penalty.setCreatedAt(now);

        if (request.getType() == UserPenalty.PenaltyType.LOCK_POST) {
            penalty.setEndDate(now.plusDays(request.getDurationDays()));
        }

        if (request.getType() == UserPenalty.PenaltyType.BAN_ACCOUNT) {
            user.setStatus(User.UserStatus.BANNED);
            penalty.setEndDate(null);
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

    private ModerationLog.ModerationAction mapPenaltyAction(UserPenalty.PenaltyType type) {
        return switch (type) {
            case WARNING -> ModerationLog.ModerationAction.WARNING;
            case LOCK_POST -> ModerationLog.ModerationAction.LOCK_POST;
            case BAN_ACCOUNT -> ModerationLog.ModerationAction.BAN_ACCOUNT;
        };
    }
}