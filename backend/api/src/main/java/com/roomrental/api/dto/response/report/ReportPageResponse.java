package com.roomrental.api.dto.response.report;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class ReportPageResponse {
    private List<ReportResponse> reports;
    private int currentPage;
    private int totalPages;
    private long totalElements;
}