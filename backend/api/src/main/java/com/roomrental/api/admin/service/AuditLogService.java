package com.roomrental.api.admin.service;

import com.roomrental.api.admin.dto.response.AuditLogPageResponse;
import com.roomrental.api.admin.entity.AuditLog;

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