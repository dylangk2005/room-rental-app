package com.roomrental.api.service.impl;

import com.roomrental.api.dto.request.report.CreateReportRequest;
import com.roomrental.api.dto.request.report.ResolveReportRequest;
import com.roomrental.api.dto.response.report.ReportPageResponse;
import com.roomrental.api.dto.response.report.ReportDetailResponse;
import com.roomrental.api.dto.response.report.ReportSummaryResponse;
import com.roomrental.api.entity.*;
import com.roomrental.api.exception.AppException;
import com.roomrental.api.repository.PostRepository;
import com.roomrental.api.repository.ReportImageRepository;
import com.roomrental.api.repository.ReportRepository;
import com.roomrental.api.repository.UserRepository;
import com.roomrental.api.service.AuditLogService;
import com.roomrental.api.service.CloudinaryService;
import com.roomrental.api.service.ModerationLogService;
import com.roomrental.api.service.NotificationService;
import com.roomrental.api.service.ReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ReportServiceImpl implements ReportService {

    private final ReportRepository reportRepository;
    private final ReportImageRepository reportImageRepository;
    private final UserRepository userRepository;
    private final PostRepository postRepository;
    private final CloudinaryService cloudinaryService;
    private final NotificationService notificationService;
    private final AuditLogService auditLogService;
    private final ModerationLogService moderationLogService;

    @Override
    @Transactional
    public ReportDetailResponse createReport(Integer userId, CreateReportRequest request, List<MultipartFile> images) {
        User reporter = userRepository.findById(userId)
                .orElseThrow(() -> AppException.notFound("Không tìm thấy người dùng"));

        Post post = postRepository.findById(request.getPostId())
                .orElseThrow(() -> AppException.notFound("Không tìm thấy tin đăng"));

        if (post.getUser() != null && post.getUser().getId().equals(userId)) {
            throw AppException.badRequest("Bạn không thể báo cáo tin đăng của chính mình");
        }

        if (reportRepository.existsByUserIdAndPostId(userId, post.getId())) {
            throw AppException.badRequest("Bạn đã báo cáo tin đăng này trước đó");
        }

        Report report = new Report();
        report.setUser(reporter);
        report.setPost(post);
        report.setReason(request.getReason());
        report.setDescription(request.getDescription());
        report.setStatus(Report.ReportStatus.PENDING);
        report.setCreatedAt(LocalDateTime.now());

        Report saved = reportRepository.save(report);

        if (images != null && !images.isEmpty()) {
            if (images.size() > 5) {
                throw AppException.badRequest("Không được tải lên quá 5 ảnh minh chứng");
            }

            for (MultipartFile image : images) {
                String url = cloudinaryService.uploadImage(image);

                ReportImage reportImage = new ReportImage();
                reportImage.setReport(saved);
                reportImage.setImageUrl(url);
                reportImage.setUpdatedAt(LocalDateTime.now());

                reportImageRepository.save(reportImage);
            }
        }

        notificationService.notifyRole(
                "MODERATOR",
                Notification.NotificationType.REPORT_INFORMATION,
                "Có báo cáo mới cho tin đăng: " + post.getTitle()
        );

        auditLogService.log(
                userId,
                "CREATE_REPORT",
                AuditLog.TargetType.REPORT,
                saved.getId(),
                request.getReason()
        );

        return mapDetailResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public ReportPageResponse getReports(Report.ReportStatus status, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Order.desc("createdAt")));

        Page<Report> result = status != null
                ? reportRepository.findByStatus(status, pageable)
                : reportRepository.findAll(pageable);

        return mapPage(result);
    }

    @Override
    @Transactional(readOnly = true)
    public ReportDetailResponse getReportDetail(Integer reportId) {
        Report report = reportRepository.findById(reportId)
                .orElseThrow(() -> AppException.notFound("Không tìm thấy báo cáo"));

        return mapDetailResponse(report);
    }

    @Override
    @Transactional
    public ReportDetailResponse resolveReport(Integer moderatorId, Integer reportId, ResolveReportRequest request) {
        if (request.getDecision() == Report.ReportStatus.PENDING) {
            throw AppException.badRequest("Kết quả xử lý không thể là PENDING");
        }

        Report report = reportRepository.findById(reportId)
                .orElseThrow(() -> AppException.notFound("Không tìm thấy báo cáo"));

        if (report.getStatus() != Report.ReportStatus.PENDING) {
            throw AppException.badRequest("Báo cáo này đã được xử lý");
        }

        User moderator = userRepository.findById(moderatorId)
                .orElseThrow(() -> AppException.notFound("Không tìm thấy người kiểm duyệt"));

        report.setStatus(request.getDecision());
        report.setModerator(moderator);
        report.setResolvedAt(LocalDateTime.now());
        report.setResolutionNote(request.getResolutionNote());

        Post post = report.getPost();

        if (request.getDecision() == Report.ReportStatus.RESOLVED && request.getPostAction() != null) {
            if (request.getPostAction() == Post.PostStatus.DELETED) {
                throw AppException.badRequest("Không xử lý xóa cứng tin đăng từ báo cáo");
            }

            post.setStatus(request.getPostAction());
            post.setUpdatedAt(LocalDateTime.now());
            postRepository.save(post);
        }

        Report saved = reportRepository.save(report);

        ModerationLog.ModerationAction action =
                request.getDecision() == Report.ReportStatus.RESOLVED
                        ? ModerationLog.ModerationAction.ACCEPT_REPORT
                        : ModerationLog.ModerationAction.REJECT_REPORT;

        moderationLogService.log(
                moderatorId,
                action,
                ModerationLog.TargetType.REPORT,
                saved.getId(),
                request.getResolutionNote()
        );

        auditLogService.log(
                moderatorId,
                action.name(),
                AuditLog.TargetType.REPORT,
                saved.getId(),
                request.getResolutionNote()
        );

        notificationService.notifyUser(
                report.getUser().getId(),
                Notification.NotificationType.REPORT_INFORMATION,
                "Báo cáo của bạn đã được xử lý: " + saved.getStatus().name()
        );

        if (request.getDecision() == Report.ReportStatus.RESOLVED
                && request.getPostAction() != null
                && post.getUser() != null) {
            notificationService.notifyUser(
                    post.getUser().getId(),
                    Notification.NotificationType.POST_INFORMATION,
                    "Tin đăng của bạn đã được xử lý do có báo cáo vi phạm: " + post.getTitle()
            );
        }

        return mapDetailResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public ReportPageResponse getMyReports(Integer userId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Order.desc("createdAt")));

        return mapPage(reportRepository.findByUserId(userId, pageable));
    }

    private ReportPageResponse mapPage(Page<Report> page) {
        List<ReportSummaryResponse> reports = page.getContent()
                .stream()
                .map(this::mapSummaryResponse)
                .toList();

        return ReportPageResponse.builder()
                .reports(reports)
                .currentPage(page.getNumber())
                .totalPages(page.getTotalPages())
                .totalElements(page.getTotalElements())
                .build();
    }
    private ReportSummaryResponse mapSummaryResponse(Report report) {
        User reporter = report.getUser();
        Post post = report.getPost();

        int imageCount = reportImageRepository.findByReportId(report.getId()).size();

        return ReportSummaryResponse.builder()
                .id(report.getId())
                .reason(report.getReason())
                .status(report.getStatus() != null ? report.getStatus().name() : null)
                .createdAt(report.getCreatedAt())
                .reporterId(reporter != null ? reporter.getId() : null)
                .reporterName(reporter != null ? reporter.getFullName() : null)
                .postId(post != null ? post.getId() : null)
                .postTitle(post != null ? post.getTitle() : null)
                .postStatus(post != null && post.getStatus() != null ? post.getStatus().name() : null)
                .imageCount(imageCount)
                .build();
    }

    private ReportDetailResponse mapDetailResponse(Report report) {
        User reporter = report.getUser();
        Post post = report.getPost();
        User postOwner = post != null ? post.getUser() : null;
        User moderator = report.getModerator();

        List<String> imageUrls = reportImageRepository.findByReportId(report.getId())
                .stream()
                .map(ReportImage::getImageUrl)
                .toList();

        return ReportDetailResponse.builder()
                .id(report.getId())
                .reason(report.getReason())
                .description(report.getDescription())
                .status(report.getStatus() != null ? report.getStatus().name() : null)
                .createdAt(report.getCreatedAt())
                .resolvedAt(report.getResolvedAt())
                .resolutionNote(report.getResolutionNote())
                .imageUrls(imageUrls)
                .reporterId(reporter != null ? reporter.getId() : null)
                .reporterName(reporter != null ? reporter.getFullName() : null)
                .reporterEmail(reporter != null ? reporter.getEmail() : null)
                .postId(post != null ? post.getId() : null)
                .postTitle(post != null ? post.getTitle() : null)
                .postStatus(post != null && post.getStatus() != null ? post.getStatus().name() : null)
                .postOwnerId(postOwner != null ? postOwner.getId() : null)
                .postOwnerName(postOwner != null ? postOwner.getFullName() : null)
                .moderatorId(moderator != null ? moderator.getId() : null)
                .moderatorName(moderator != null ? moderator.getFullName() : null)
                .build();
    }
}