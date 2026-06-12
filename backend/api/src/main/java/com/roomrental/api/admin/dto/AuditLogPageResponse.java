package com.roomrental.api.admin.dto;

import java.util.List;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class AuditLogPageResponse {

    private List<AuditLogResponse> logs;

    private int currentPage;

    private int totalPages;

    private long totalElements;
}