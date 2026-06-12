package com.roomrental.api.admin.controller;

import com.roomrental.api.admin.dto.response.AuditLogPageResponse;
import com.roomrental.api.admin.entity.AuditLog;
import com.roomrental.api.admin.service.AuditLogService;
import com.roomrental.api.common.dto.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/audit-logs")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AuditLogController {

    private final AuditLogService auditLogService;

    @GetMapping
    public ResponseEntity<ApiResponse<AuditLogPageResponse>> getAuditLogs(
            @RequestParam(required = false) String action,
            @RequestParam(required = false) Integer actorId,
            @RequestParam(required = false) AuditLog.TargetType targetType,
            @RequestParam(required = false) Integer targetId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        return ResponseEntity.ok(ApiResponse.success(
                auditLogService.getAuditLogs(action, actorId, targetType, targetId, page, size)
        ));
    }
}