package com.roomrental.api.service.impl;

import com.roomrental.api.dto.response.moderation.ModerationLogPageResponse;
import com.roomrental.api.dto.response.moderation.ModerationLogResponse;
import com.roomrental.api.entity.ModerationLog;
import com.roomrental.api.entity.User;
import com.roomrental.api.exception.AppException;
import com.roomrental.api.repository.ModerationLogRepository;
import com.roomrental.api.repository.UserRepository;
import com.roomrental.api.service.ModerationLogService;
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
public class ModerationLogServiceImpl implements ModerationLogService {

    private final ModerationLogRepository moderationLogRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional
    public void log(
            Integer moderatorId,
            ModerationLog.ModerationAction action,
            ModerationLog.TargetType targetType,
            Integer targetId,
            String reason
    ) {
        User moderator = userRepository.findById(moderatorId)
                .orElseThrow(() -> AppException.notFound("Không tìm thấy người kiểm duyệt"));

        ModerationLog moderationLog = new ModerationLog();
        moderationLog.setUser(moderator);
        moderationLog.setAction(action);
        moderationLog.setTargetType(targetType);
        moderationLog.setTargetId(targetId);
        moderationLog.setReason(reason);
        moderationLog.setCreatedAt(LocalDateTime.now());

        moderationLogRepository.save(moderationLog);
    }

    @Override
    @Transactional(readOnly = true)
    public ModerationLogPageResponse getLogs(
            Integer moderatorId,
            ModerationLog.ModerationAction action,
            ModerationLog.TargetType targetType,
            Integer targetId,
            int page,
            int size
    ) {
        Pageable pageable = PageRequest.of(
                page,
                size,
                Sort.by(Sort.Order.desc("createdAt"))
        );

        Page<ModerationLog> result;

        if (moderatorId != null) {
            result = moderationLogRepository.findByUser_Id(moderatorId, pageable);
        } else if (action != null) {
            result = moderationLogRepository.findByAction(action, pageable);
        } else if (targetType != null && targetId != null) {
            result = moderationLogRepository.findByTargetTypeAndTargetId(targetType, targetId, pageable);
        } else {
            result = moderationLogRepository.findAll(pageable);
        }

        List<ModerationLogResponse> logs = result.getContent()
                .stream()
                .map(this::mapResponse)
                .toList();

        return ModerationLogPageResponse.builder()
                .logs(logs)
                .currentPage(result.getNumber())
                .totalPages(result.getTotalPages())
                .totalElements(result.getTotalElements())
                .build();
    }

    private ModerationLogResponse mapResponse(ModerationLog moderationLog) {
        User moderator = moderationLog.getUser();

        return ModerationLogResponse.builder()
                .id(moderationLog.getId())
                .action(moderationLog.getAction() != null ? moderationLog.getAction().name() : null)
                .targetType(moderationLog.getTargetType() != null ? moderationLog.getTargetType().name() : null)
                .targetId(moderationLog.getTargetId())
                .reason(moderationLog.getReason())
                .createdAt(moderationLog.getCreatedAt())
                .moderatorId(moderator != null ? moderator.getId() : null)
                .moderatorName(moderator != null ? moderator.getFullName() : null)
                .moderatorEmail(moderator != null ? moderator.getEmail() : null)
                .build();
    }
}