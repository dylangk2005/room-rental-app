package com.roomrental.api.service;

import com.roomrental.api.entity.ModerationLog;

public interface ModerationLogService {

    void log(
            Integer moderatorId, // Người thực hiện hành động
            ModerationLog.ModerationAction action, // Hành động đã thực hiện
            ModerationLog.TargetType targetType, // Loại đối tượng bị ảnh hưởng
            Integer targetId, // ID của đối tượng bị ảnh hưởng
            String reason // Lý do thực hiện hành động (nếu có)
    );
}