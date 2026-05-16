package com.roomrental.api.service.impl;

import com.roomrental.api.entity.AuditLog;
import com.roomrental.api.entity.User;
import com.roomrental.api.exception.AppException;
import com.roomrental.api.repository.AuditLogRepository;
import com.roomrental.api.repository.UserRepository;
import com.roomrental.api.service.AuditLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class AuditLogServiceImpl implements AuditLogService {

    private final AuditLogRepository auditLogRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional
    public void log(Integer userId, String action, AuditLog.TargetType targetType, Integer targetId, String reason) {
        User user = null;

        if (userId != null) {
            user = userRepository.findById(userId)
                    .orElseThrow(() -> AppException.notFound("Không tìm thấy người dùng ghi audit log"));
        }

        AuditLog auditLog = new AuditLog();
        auditLog.setUser(user);
        auditLog.setAction(action);
        auditLog.setTargetType(targetType);
        auditLog.setTargetId(targetId);
        auditLog.setReason(reason);
        auditLog.setCreatedAt(LocalDateTime.now());

        auditLogRepository.save(auditLog);
    }
}