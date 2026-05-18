package com.roomrental.api.service;

import com.roomrental.api.dto.response.admin.BackupResponse;

public interface BackupService {
    BackupResponse runBackup(Integer adminId);
}