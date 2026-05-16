package com.roomrental.api.dto.response.audit;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class AuditLogPageResponse {

    private List<AuditLogResponse> logs;

    private int currentPage;

    private int totalPages;

    private long totalElements;
}