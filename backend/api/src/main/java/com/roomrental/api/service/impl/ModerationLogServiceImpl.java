package com.roomrental.api.service.impl;

import com.roomrental.api.entity.ModerationLog;
import com.roomrental.api.entity.User;
import com.roomrental.api.exception.AppException;
import com.roomrental.api.repository.ModerationLogRepository;
import com.roomrental.api.repository.UserRepository;
import com.roomrental.api.service.ModerationLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

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
}