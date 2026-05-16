package com.roomrental.api.dto.response.audit;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class AuditLogResponse {

    private Integer id;

    private String action;

    private String targetType;

    private Integer targetId;

    private String reason;

    private LocalDateTime createdAt;

    private Integer actorId;

    private String actorName;

    private String actorEmail;
}