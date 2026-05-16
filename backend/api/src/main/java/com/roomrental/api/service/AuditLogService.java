package com.roomrental.api.service;

import com.roomrental.api.entity.AuditLog;

public interface AuditLogService {

    void log(Integer userId, String action, AuditLog.TargetType targetType, Integer targetId, String reason); // Ghi lại một hành động vào audit log
}