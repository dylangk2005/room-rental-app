package com.roomrental.api.repository;

import com.roomrental.api.entity.AuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Integer> {

    @EntityGraph(attributePaths = "user")
    Page<AuditLog> findAll(Pageable pageable); // Lấy tất cả audit log với thông tin user, có phân trang

    @EntityGraph(attributePaths = "user")
    Page<AuditLog> findByAction(String action, Pageable pageable); // Lấy audit log theo hành động, có phân trang

    @EntityGraph(attributePaths = "user")
    Page<AuditLog> findByUser_Id(Integer userId, Pageable pageable); // Lấy audit log theo user, có phân trang

    @EntityGraph(attributePaths = "user")
    Page<AuditLog> findByTargetTypeAndTargetId(AuditLog.TargetType targetType, Integer targetId, Pageable pageable); // Lấy audit log theo loại đối tượng và ID đối tượng, có phân trang
}