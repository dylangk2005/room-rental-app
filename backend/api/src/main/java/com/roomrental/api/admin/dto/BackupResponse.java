package com.roomrental.api.admin.dto;

import java.time.LocalDateTime;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class BackupResponse {
    private String fileName;
    private String filePath;
    private Long fileSize;
    private LocalDateTime createdAt;
}