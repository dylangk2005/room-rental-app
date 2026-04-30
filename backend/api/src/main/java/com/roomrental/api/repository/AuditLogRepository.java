package com.roomrental.api.repository;

import com.roomrental.api.entity.AuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AuditLogRepository extends JpaRepository <AuditLog, Integer> {
    Page<AuditLog> findByUserId(Integer userId, Pageable pageable);
    Page<AuditLog> findByTargetTypeAndTargetId(AuditLog.TargetType targetType, Integer targetId, Pageable pageable);
}
