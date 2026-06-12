package com.roomrental.api.admin.dto.response;

import java.time.LocalDateTime;
import lombok.Builder;
import lombok.Data;

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