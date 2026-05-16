package com.roomrental.api.service;

import com.roomrental.api.dto.response.audit.AuditLogPageResponse;
import com.roomrental.api.entity.AuditLog;

public interface AuditLogService {

    void log(Integer userId, String action, AuditLog.TargetType targetType, Integer targetId, String reason);

    AuditLogPageResponse getAuditLogs(
            String action,
            Integer actorId,
            AuditLog.TargetType targetType,
            Integer targetId,
            int page,
            int size
    );
}