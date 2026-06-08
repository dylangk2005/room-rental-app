package com.roomrental.api.repository;

import com.roomrental.api.entity.ModerationLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface ModerationLogRepository extends JpaRepository<ModerationLog, Integer> {

    @EntityGraph(attributePaths = "user")
    Page<ModerationLog> findAll(Pageable pageable); // Lấy tất cả log với thông tin người dùng, phân trang

    @EntityGraph(attributePaths = "user")
    Page<ModerationLog> findByUser_Id(Integer userId, Pageable pageable); // Lấy log theo ID người dùng, phân trang

    @EntityGraph(attributePaths = "user")
    Page<ModerationLog> findByAction(ModerationLog.ModerationAction action, Pageable pageable); // Lấy log theo hành động, phân trang

    @EntityGraph(attributePaths = "user")
    Page<ModerationLog> findByTargetTypeAndTargetId( // Lấy log theo loại đối tượng và ID đối tượng, phân trang
            ModerationLog.TargetType targetType,
            Integer targetId,
            Pageable pageable
    );

    interface ModeratorStatsView { // Giao diện projection để lấy thống kê hoạt động của moderator
        Integer getModeratorId();
        String getModeratorName();
        Long getApprovedPosts();
        Long getRejectedPosts();
        Long getResolvedReports();
        Long getRejectedReports();
        Long getWarnings();
        Long getLockedPosts();
        Long getBannedAccounts();
        Long getTotalActions();
    }

    @EntityGraph(attributePaths = "user")
    @Query("""
            SELECT log
            FROM ModerationLog log
            WHERE (:moderatorId IS NULL OR log.user.id = :moderatorId)
              AND (:action IS NULL OR log.action = :action)
              AND (:targetType IS NULL OR log.targetType = :targetType)
              AND (:targetId IS NULL OR log.targetId = :targetId)
            """)
    Page<ModerationLog> search(
            @Param("moderatorId") Integer moderatorId,
            @Param("action") ModerationLog.ModerationAction action,
            @Param("targetType") ModerationLog.TargetType targetType,
            @Param("targetId") Integer targetId,
            Pageable pageable
    );

    boolean existsByUser_IdAndTargetTypeAndTargetId(
            Integer userId,
            ModerationLog.TargetType targetType,
            Integer targetId
    );

    long countByActionAndCreatedAtBetween(
            ModerationLog.ModerationAction action,
            LocalDateTime from,
            LocalDateTime to
    );

    long countByCreatedAtBetween(LocalDateTime from, LocalDateTime to);

    @Query("""
    SELECT
        u.id AS moderatorId,
        u.fullName AS moderatorName,
        SUM(CASE WHEN m.action = 'ACCEPT_POST' THEN 1 ELSE 0 END) AS approvedPosts,
        SUM(CASE WHEN m.action = 'REJECT_POST' THEN 1 ELSE 0 END) AS rejectedPosts,
        SUM(CASE WHEN m.action = 'ACCEPT_REPORT' THEN 1 ELSE 0 END) AS resolvedReports,
        SUM(CASE WHEN m.action = 'REJECT_REPORT' THEN 1 ELSE 0 END) AS rejectedReports,
        SUM(CASE WHEN m.action = 'WARNING' THEN 1 ELSE 0 END) AS warnings,
        SUM(CASE WHEN m.action = 'LOCK_POST' THEN 1 ELSE 0 END) AS lockedPosts,
        SUM(CASE WHEN m.action = 'BAN_ACCOUNT' THEN 1 ELSE 0 END) AS bannedAccounts,
        COUNT(m) AS totalActions
    FROM ModerationLog m
    JOIN m.user u
    WHERE m.createdAt BETWEEN :from AND :to
    GROUP BY u.id, u.fullName
""")
    List<ModeratorStatsView> getModeratorStats(
            @Param("from") LocalDateTime from,
            @Param("to") LocalDateTime to
    );

}
