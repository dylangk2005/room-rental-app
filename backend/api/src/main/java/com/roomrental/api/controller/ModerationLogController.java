package com.roomrental.api.controller;

import com.roomrental.api.dto.response.common.ApiResponse;
import com.roomrental.api.dto.response.moderation.ModerationLogPageResponse;
import com.roomrental.api.entity.ModerationLog;
import com.roomrental.api.service.ModerationLogService;
import com.roomrental.api.util.AuthHelper;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
public class ModerationLogController {

    private final ModerationLogService moderationLogService;
    private final AuthHelper authHelper;

    @GetMapping("/api/moderation-logs/my-history")
    @PreAuthorize("hasAnyRole('MODERATOR', 'MANAGER', 'ADMIN')")
    public ResponseEntity<ApiResponse<ModerationLogPageResponse>> getMyHistory(
            @RequestParam(required = false) ModerationLog.ModerationAction action,
            @RequestParam(required = false) ModerationLog.TargetType targetType,
            @RequestParam(required = false) Integer targetId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        return ResponseEntity.ok(ApiResponse.success(
                moderationLogService.getLogs(
                        authHelper.getCurrentUserId(),
                        action,
                        targetType,
                        targetId,
                        page,
                        size
                )
        ));
    }

    @GetMapping("/api/moderation-logs")
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
    public ResponseEntity<ApiResponse<ModerationLogPageResponse>> getLogs(
            @RequestParam(required = false) Integer moderatorId,
            @RequestParam(required = false) ModerationLog.ModerationAction action,
            @RequestParam(required = false) ModerationLog.TargetType targetType,
            @RequestParam(required = false) Integer targetId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        return ResponseEntity.ok(ApiResponse.success(
                moderationLogService.getLogs(
                        moderatorId,
                        action,
                        targetType,
                        targetId,
                        page,
                        size
                )
        ));
    }
}