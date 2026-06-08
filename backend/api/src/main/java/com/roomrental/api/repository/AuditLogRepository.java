package com.roomrental.api.repository;

import com.roomrental.api.entity.AuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Integer> {

    @EntityGraph(attributePaths = "user")
    Page<AuditLog> findAll(Pageable pageable); // Lấy tất cả nhật ký hệ thống với thông tin người dùng, có phân trang

    @EntityGraph(attributePaths = "user")
    Page<AuditLog> findByAction(String action, Pageable pageable); // Lấy nhật ký hệ thống theo hành động, có phân trang

    @EntityGraph(attributePaths = "user")
    Page<AuditLog> findByUser_Id(Integer userId, Pageable pageable); // Lấy nhật ký hệ thống theo người dùng, có phân trang

    @EntityGraph(attributePaths = "user")
    Page<AuditLog> findByTargetTypeAndTargetId(AuditLog.TargetType targetType, Integer targetId, Pageable pageable); // Lấy nhật ký hệ thống theo loại đối tượng và ID đối tượng, có phân trang
    @EntityGraph(attributePaths = "user")
    @Query("""
            SELECT log
            FROM AuditLog log
            WHERE (:action IS NULL OR LOWER(log.action) LIKE LOWER(CONCAT('%', :action, '%')))
              AND (:actorId IS NULL OR log.user.id = :actorId)
              AND (:targetType IS NULL OR log.targetType = :targetType)
              AND (:targetId IS NULL OR log.targetId = :targetId)
            """)
    Page<AuditLog> search(
            @Param("action") String action,
            @Param("actorId") Integer actorId,
            @Param("targetType") AuditLog.TargetType targetType,
            @Param("targetId") Integer targetId,
            Pageable pageable
    );
}
