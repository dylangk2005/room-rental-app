package com.roomrental.api.service.impl;

import com.roomrental.api.dto.response.audit.AuditLogPageResponse;
import com.roomrental.api.dto.response.audit.AuditLogResponse;
import com.roomrental.api.entity.AuditLog;
import com.roomrental.api.entity.User;
import com.roomrental.api.exception.AppException;
import com.roomrental.api.repository.AuditLogRepository;
import com.roomrental.api.repository.UserRepository;
import com.roomrental.api.service.AuditLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

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

    @Override
    @Transactional(readOnly = true)
    public AuditLogPageResponse getAuditLogs(
            String action,
            Integer actorId,
            AuditLog.TargetType targetType,
            Integer targetId,
            int page,
            int size
    ) {
        Pageable pageable = PageRequest.of(
                page,
                size,
                Sort.by(Sort.Order.desc("createdAt"))
        );

        String normalizedAction = action != null && !action.isBlank() ? action.trim() : null;
        Page<AuditLog> result = auditLogRepository.search(
                normalizedAction,
                actorId,
                targetType,
                targetId,
                pageable
        );

        List<AuditLogResponse> logs = result.getContent()
                .stream()
                .map(this::mapResponse)
                .toList();

        return AuditLogPageResponse.builder()
                .logs(logs)
                .currentPage(result.getNumber())
                .totalPages(result.getTotalPages())
                .totalElements(result.getTotalElements())
                .build();
    }

    private AuditLogResponse mapResponse(AuditLog auditLog) {
        User actor = auditLog.getUser();

        return AuditLogResponse.builder()
                .id(auditLog.getId())
                .action(auditLog.getAction())
                .targetType(auditLog.getTargetType() != null ? auditLog.getTargetType().name() : null)
                .targetId(auditLog.getTargetId())
                .reason(auditLog.getReason())
                .createdAt(auditLog.getCreatedAt())
                .actorId(actor != null ? actor.getId() : null)
                .actorName(actor != null ? actor.getFullName() : null)
                .actorEmail(actor != null ? actor.getEmail() : null)
                .build();
    }
}
