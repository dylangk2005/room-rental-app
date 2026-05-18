package com.roomrental.api.dto.response.admin;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class BackupResponse {
    private String fileName;
    private String filePath;
    private Long fileSize;
    private LocalDateTime createdAt;
}