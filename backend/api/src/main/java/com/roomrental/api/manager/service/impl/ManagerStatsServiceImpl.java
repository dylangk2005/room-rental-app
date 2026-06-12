package com.roomrental.api.manager.service.impl;

import com.roomrental.api.manager.dto.response.ModerationStatsResponse;
import com.roomrental.api.manager.dto.response.ModeratorStatsResponse;
import com.roomrental.api.manager.dto.response.PostStatsResponse;
import com.roomrental.api.manager.dto.response.PostTypeStatsResponse;
import com.roomrental.api.manager.dto.response.RevenueStatsResponse;
import com.roomrental.api.manager.dto.response.UserStatsResponse;
import com.roomrental.api.manager.service.ManagerStatsService;
import com.roomrental.api.moderation.entity.ModerationLog;
import com.roomrental.api.moderation.repository.ModerationLogRepository;
import com.roomrental.api.payment.entity.Payment;
import com.roomrental.api.payment.repository.PaymentRepository;
import com.roomrental.api.post.entity.Post.PostStatus;
import com.roomrental.api.post.entity.Post;
import com.roomrental.api.post.repository.PostRepository;
import com.roomrental.api.user.entity.User;
import com.roomrental.api.user.repository.UserRepository;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ManagerStatsServiceImpl implements ManagerStatsService {

    private final UserRepository userRepository;
    private final PostRepository postRepository;
    private final PaymentRepository paymentRepository;
    private final ModerationLogRepository moderationLogRepository;

    @Override
    @Transactional(readOnly = true)
    public UserStatsResponse getUserStats(LocalDate from, LocalDate to) {
        DateRange range = resolveRange(from, to);

        return UserStatsResponse.builder()
                .totalUsers(userRepository.count())
                .newUsers(userRepository.countByCreatedAtBetween(range.from(), range.to()))
                .activeUsers(userRepository.countByStatus(User.UserStatus.ACTIVE))
                .inactiveUsers(userRepository.countByStatus(User.UserStatus.INACTIVE))
                .bannedUsers(userRepository.countByStatus(User.UserStatus.BANNED))
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public PostStatsResponse getPostStats(LocalDate from, LocalDate to) {
        DateRange range = resolveRange(from, to);

        List<PostTypeStatsResponse> byPostType = postRepository
                .countPostsByType(range.from(), range.to())
                .stream()
                .map(item -> PostTypeStatsResponse.builder()
                        .postTypeName(item.getPostTypeName())
                        .totalPosts(nullSafe(item.getTotalPosts()))
                        .build())
                .toList();

        return PostStatsResponse.builder()
                .totalPosts(postRepository.count())
                .newPosts(postRepository.countByCreatedAtBetween(range.from(), range.to()))
                .draftPosts(postRepository.countByStatus(Post.PostStatus.DRAFT))
                .pendingPosts(postRepository.countByStatus(Post.PostStatus.PENDING))
                .activePosts(postRepository.countByStatus(Post.PostStatus.ACTIVE))
                .rejectedPosts(postRepository.countByStatus(Post.PostStatus.REJECTED))
                .expiredPosts(postRepository.countByStatus(Post.PostStatus.EXPIRED))
                .hiddenPosts(postRepository.countByStatus(Post.PostStatus.HIDDEN))
                .deletedPosts(postRepository.countByStatus(Post.PostStatus.DELETED))
                .byPostType(byPostType)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public RevenueStatsResponse getRevenueStats(LocalDate from, LocalDate to) {
        DateRange range = resolveRange(from, to);

        BigDecimal postPaymentRevenue = sumPayments(
                List.of(Payment.PaymentType.POST_PAYMENT),
                range
        );

        BigDecimal renewRevenue = sumPayments(
                List.of(Payment.PaymentType.EXTEND),
                range
        );

        BigDecimal pushRevenue = sumPayments(
                List.of(Payment.PaymentType.PUSH),
                range
        );

        BigDecimal refundAmount = sumPayments(
                List.of(Payment.PaymentType.REFUND),
                range
        );

        BigDecimal grossRevenue = postPaymentRevenue
                .add(renewRevenue)
                .add(pushRevenue);

        return RevenueStatsResponse.builder()
                .grossRevenue(grossRevenue)
                .postPaymentRevenue(postPaymentRevenue)
                .renewRevenue(renewRevenue)
                .pushRevenue(pushRevenue)
                .refundAmount(refundAmount)
                .netRevenue(grossRevenue.subtract(refundAmount))
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public ModerationStatsResponse getModerationStats(LocalDate from, LocalDate to) {
        DateRange range = resolveRange(from, to);

        List<ModeratorStatsResponse> byModerator = moderationLogRepository
                .getModeratorStats(range.from(), range.to())
                .stream()
                .map(item -> ModeratorStatsResponse.builder()
                        .moderatorId(item.getModeratorId())
                        .moderatorName(item.getModeratorName())
                        .approvedPosts(nullSafe(item.getApprovedPosts()))
                        .rejectedPosts(nullSafe(item.getRejectedPosts()))
                        .resolvedReports(nullSafe(item.getResolvedReports()))
                        .rejectedReports(nullSafe(item.getRejectedReports()))
                        .warnings(nullSafe(item.getWarnings()))
                        .lockedPosts(nullSafe(item.getLockedPosts()))
                        .bannedAccounts(nullSafe(item.getBannedAccounts()))
                        .totalActions(nullSafe(item.getTotalActions()))
                        .build())
                .toList();

        return ModerationStatsResponse.builder()
                .approvedPosts(countModerationAction(ModerationLog.ModerationAction.ACCEPT_POST, range))
                .rejectedPosts(countModerationAction(ModerationLog.ModerationAction.REJECT_POST, range))
                .resolvedReports(countModerationAction(ModerationLog.ModerationAction.ACCEPT_REPORT, range))
                .rejectedReports(countModerationAction(ModerationLog.ModerationAction.REJECT_REPORT, range))
                .warnings(countModerationAction(ModerationLog.ModerationAction.WARNING, range))
                .lockedPosts(countModerationAction(ModerationLog.ModerationAction.LOCK_POST, range))
                .bannedAccounts(countModerationAction(ModerationLog.ModerationAction.BAN_ACCOUNT, range))
                .totalActions(moderationLogRepository.countByCreatedAtBetween(range.from(), range.to()))
                .byModerator(byModerator)
                .build();
    }

    private long countModerationAction(ModerationLog.ModerationAction action, DateRange range) {
        return moderationLogRepository.countByActionAndCreatedAtBetween(
                action,
                range.from(),
                range.to()
        );
    }

    private BigDecimal sumPayments(List<Payment.PaymentType> types, DateRange range) {
        BigDecimal value = paymentRepository.sumFinalFeeByTypesAndCreatedAtBetween(
                types,
                range.from(),
                range.to()
        );

        return value != null ? value : BigDecimal.ZERO;
    }

    private DateRange resolveRange(LocalDate from, LocalDate to) {
        if (from == null || to == null) {
            YearMonth currentMonth = YearMonth.now();
            LocalDate start = currentMonth.atDay(1);
            LocalDate end = currentMonth.atEndOfMonth();

            return new DateRange(
                    start.atStartOfDay(),
                    end.plusDays(1).atStartOfDay()
            );
        }

        return new DateRange(
                from.atStartOfDay(),
                to.plusDays(1).atStartOfDay()
        );
    }

    private long nullSafe(Long value) {
        return value != null ? value : 0L;
    }

    private record DateRange(LocalDateTime from, LocalDateTime to) {
    }
}