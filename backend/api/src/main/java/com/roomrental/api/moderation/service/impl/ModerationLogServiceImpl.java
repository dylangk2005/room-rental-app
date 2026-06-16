package com.roomrental.api.moderation.service.impl;

import com.roomrental.api.common.exception.AppException;
import com.roomrental.api.moderation.dto.response.ModerationLogPageResponse;
import com.roomrental.api.moderation.dto.response.ModerationLogResponse;
import com.roomrental.api.moderation.dto.response.ModerationTargetDetailResponse;
import com.roomrental.api.moderation.entity.ModerationLog;
import com.roomrental.api.moderation.entity.Report;
import com.roomrental.api.moderation.entity.ReportImage;
import com.roomrental.api.moderation.repository.ModerationLogRepository;
import com.roomrental.api.moderation.repository.ReportImageRepository;
import com.roomrental.api.moderation.repository.ReportRepository;
import com.roomrental.api.moderation.service.ModerationLogService;
import com.roomrental.api.post.entity.Post;
import com.roomrental.api.post.entity.PostImage;
import com.roomrental.api.post.repository.PostImageRepository;
import com.roomrental.api.post.repository.PostRepository;
import com.roomrental.api.pricing.entity.MembershipLevel;
import com.roomrental.api.user.entity.Role;
import com.roomrental.api.user.entity.User;
import com.roomrental.api.user.entity.UserPenalty;
import com.roomrental.api.user.repository.UserPenaltyRepository;
import com.roomrental.api.user.repository.UserRepository;
import java.time.LocalDateTime;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ModerationLogServiceImpl implements ModerationLogService {

    private final ModerationLogRepository moderationLogRepository;
    private final UserRepository userRepository;
    private final PostRepository postRepository;
    private final PostImageRepository postImageRepository;
    private final ReportRepository reportRepository;
    private final ReportImageRepository reportImageRepository;
    private final UserPenaltyRepository userPenaltyRepository;

    @Override
    @Transactional
    public void log(
            Integer moderatorId,
            ModerationLog.ModerationAction action,
            ModerationLog.TargetType targetType,
            Integer targetId,
            String reason
    ) {
        User moderator = userRepository.findById(moderatorId)
                .orElseThrow(() -> AppException.notFound("Không tìm thấy người kiểm duyệt"));

        ModerationLog moderationLog = new ModerationLog();
        moderationLog.setUser(moderator);
        moderationLog.setAction(action);
        moderationLog.setTargetType(targetType);
        moderationLog.setTargetId(targetId);
        moderationLog.setReason(reason);
        moderationLog.setCreatedAt(LocalDateTime.now());

        moderationLogRepository.save(moderationLog);
    }

    @Override
    @Transactional(readOnly = true)
    public ModerationLogPageResponse getLogs(
            Integer moderatorId,
            ModerationLog.ModerationAction action,
            ModerationLog.TargetType targetType,
            Integer targetId,
            int page,
            int size
    ) {
        Pageable pageable = PageRequest.of(
                page,
                size,
                Sort.by(Sort.Order.desc("createdAt"))
        );

        Page<ModerationLog> result = moderationLogRepository.search(
                moderatorId,
                action,
                targetType,
                targetId,
                pageable
        );

        List<ModerationLogResponse> logs = result.getContent()
                .stream()
                .map(this::mapResponse)
                .toList();

        return ModerationLogPageResponse.builder()
                .logs(logs)
                .currentPage(result.getNumber())
                .totalPages(result.getTotalPages())
                .totalElements(result.getTotalElements())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public ModerationTargetDetailResponse getTargetDetail(
            Integer moderatorId,
            ModerationLog.TargetType targetType,
            Integer targetId
    ) {
        if (targetType == null || targetId == null) {
            throw AppException.badRequest("Vui lòng chọn đối tượng cần xem chi tiết");
        }

        if (moderatorId != null && !moderationLogRepository.existsByUser_IdAndTargetTypeAndTargetId(moderatorId, targetType, targetId)) {
            throw AppException.forbidden("Bạn không có quyền xem chi tiết đối tượng này");
        }

        return switch (targetType) {
            case POST -> buildPostTarget(targetType, targetId);
            case REPORT -> buildReportTarget(targetType, targetId);
            case USER -> buildUserTarget(targetType, targetId);
        };
    }

    private ModerationLogResponse mapResponse(ModerationLog moderationLog) {
        User moderator = moderationLog.getUser();

        return ModerationLogResponse.builder()
                .id(moderationLog.getId())
                .action(moderationLog.getAction() != null ? moderationLog.getAction().name() : null)
                .targetType(moderationLog.getTargetType() != null ? moderationLog.getTargetType().name() : null)
                .targetId(moderationLog.getTargetId())
                .reason(moderationLog.getReason())
                .createdAt(moderationLog.getCreatedAt())
                .moderatorId(moderator != null ? moderator.getId() : null)
                .moderatorName(moderator != null ? moderator.getFullName() : null)
                .moderatorEmail(moderator != null ? moderator.getEmail() : null)
                .build();
    }

    private ModerationTargetDetailResponse buildPostTarget(ModerationLog.TargetType targetType, Integer targetId) {
        Post post = postRepository.findDetailById(targetId)
                .orElseThrow(() -> AppException.notFound("Không tìm thấy bài đăng"));

        return ModerationTargetDetailResponse.builder()
                .targetType(targetType.name())
                .targetId(targetId)
                .post(mapPost(post))
                .build();
    }

    private ModerationTargetDetailResponse buildReportTarget(ModerationLog.TargetType targetType, Integer targetId) {
        Report report = reportRepository.findDetailById(targetId)
                .orElseThrow(() -> AppException.notFound("Không tìm thấy báo cáo"));
        Post post = report.getPost();

        return ModerationTargetDetailResponse.builder()
                .targetType(targetType.name())
                .targetId(targetId)
                .report(mapReport(report))
                .post(post != null ? mapPost(post) : null)
                .user(report.getUser() != null ? mapUser(report.getUser()) : null)
                .build();
    }

    private ModerationTargetDetailResponse buildUserTarget(ModerationLog.TargetType targetType, Integer targetId) {
        User user = userRepository.findById(targetId)
                .orElseThrow(() -> AppException.notFound("Không tìm thấy người dùng"));
        List<ModerationTargetDetailResponse.PenaltySnapshot> penalties = userPenaltyRepository
                .findByUserId(user.getId(), PageRequest.of(0, 10, Sort.by(Sort.Order.desc("createdAt"))))
                .getContent()
                .stream()
                .map(this::mapPenalty)
                .toList();

        return ModerationTargetDetailResponse.builder()
                .targetType(targetType.name())
                .targetId(targetId)
                .user(mapUser(user))
                .penalties(penalties)
                .build();
    }

    private ModerationTargetDetailResponse.ReportSnapshot mapReport(Report report) {
        Post post = report.getPost();

        return ModerationTargetDetailResponse.ReportSnapshot.builder()
                .id(report.getId())
                .reason(report.getReason())
                .description(report.getDescription())
                .status(report.getStatus() != null ? report.getStatus().name() : null)
                .createdAt(report.getCreatedAt())
                .resolvedAt(report.getResolvedAt())
                .resolutionNote(report.getResolutionNote())
                .reporter(report.getUser() != null ? mapUser(report.getUser()) : null)
                .postOwner(post != null && post.getUser() != null ? mapUser(post.getUser()) : null)
                .moderator(report.getModerator() != null ? mapUser(report.getModerator()) : null)
                .imageUrls(reportImageRepository.findByReportId(report.getId()).stream()
                        .map(ReportImage::getImageUrl)
                        .toList())
                .build();
    }

    private ModerationTargetDetailResponse.PostSnapshot mapPost(Post post) {
        return ModerationTargetDetailResponse.PostSnapshot.builder()
                .id(post.getId())
                .title(post.getTitle())
                .description(post.getDescription())
                .address(post.getAddress())
                .province(post.getProvinceRef() != null ? post.getProvinceRef().getName() : null)
                .district(post.getDistrictRef() != null ? post.getDistrictRef().getName() : null)
                .area(post.getArea())
                .rentalPrice(post.getRentalPrice())
                .status(post.getStatus() != null ? post.getStatus().name() : null)
                .createdAt(post.getCreatedAt())
                .endAt(post.getEndAt())
                .postTypeName(post.getPostType() != null ? post.getPostType().getName() : null)
                .owner(post.getUser() != null ? mapUser(post.getUser()) : null)
                .imageUrls(postImageRepository.findByPostId(post.getId()).stream()
                        .map(PostImage::getImageUrl)
                        .toList())
                .build();
    }

    private ModerationTargetDetailResponse.UserSnapshot mapUser(User user) {
        return ModerationTargetDetailResponse.UserSnapshot.builder()
                .id(user.getId())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .phoneNumber(user.getPhoneNumber())
                .status(user.getStatus() != null ? user.getStatus().name() : null)
                .role(user.getRole() != null ? user.getRole().getName() : null)
                .membershipLevel(user.getMembershipLevel() != null ? user.getMembershipLevel().getName() : null)
                .createdAt(user.getCreatedAt())
                .build();
    }

    private ModerationTargetDetailResponse.PenaltySnapshot mapPenalty(UserPenalty penalty) {
        return ModerationTargetDetailResponse.PenaltySnapshot.builder()
                .id(penalty.getId())
                .type(penalty.getType() != null ? penalty.getType().name() : null)
                .reason(penalty.getReason())
                .startDate(penalty.getStartDate())
                .endDate(penalty.getEndDate())
                .createdAt(penalty.getCreatedAt())
                .build();
    }
}