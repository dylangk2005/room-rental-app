package com.roomrental.api.moderation.dto.response;

import java.time.LocalDateTime;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ModerationLogResponse {

    private Integer id;

    private String action;

    private String targetType;

    private Integer targetId;

    private String reason;

    private LocalDateTime createdAt;

    private Integer moderatorId;

    private String moderatorName;

    private String moderatorEmail;
}