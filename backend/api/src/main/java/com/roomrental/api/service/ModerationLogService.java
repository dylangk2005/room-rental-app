package com.roomrental.api.service;

import com.roomrental.api.dto.response.moderation.ModerationLogPageResponse;
import com.roomrental.api.dto.response.moderation.ModerationTargetDetailResponse;
import com.roomrental.api.entity.ModerationLog;

public interface ModerationLogService {

    void log( // Ghi lại một hành động kiểm duyệt mới
            Integer moderatorId, // Người thực hiện hành động
            ModerationLog.ModerationAction action, // Hành động đã thực hiện
            ModerationLog.TargetType targetType, // Loại đối tượng bị ảnh hưởng
            Integer targetId, // ID của đối tượng bị ảnh hưởng
            String reason // Lý do thực hiện hành động (nếu có)
    );

    ModerationLogPageResponse getLogs( // Lấy danh sách log với các tiêu chí lọc và phân trang
            Integer moderatorId,
            ModerationLog.ModerationAction action,
            ModerationLog.TargetType targetType,
            Integer targetId,
            int page,
            int size
    );

    ModerationTargetDetailResponse getTargetDetail(
            Integer moderatorId,
            ModerationLog.TargetType targetType,
            Integer targetId
    );

}
