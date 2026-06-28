package com.roomrental.api.manager.dto.request;

import java.time.LocalDate;
import lombok.Data;

@Data
public class UserListExportRequest {
    private String status;
    private String role;
    private String keyword;
    private LocalDate from;
    private LocalDate to;
    private String exportedBy;
}
