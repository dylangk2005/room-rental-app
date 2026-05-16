package com.roomrental.api.dto.response.moderation;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

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