package com.roomrental.api.manager.dto.request;

import java.time.LocalDate;
import lombok.Data;

@Data
public class ReportListExportRequest {
    private String status;
    private LocalDate from;
    private LocalDate to;
    private String exportedBy;
}
