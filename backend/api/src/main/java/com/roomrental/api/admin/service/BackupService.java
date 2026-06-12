package com.roomrental.api.admin.service;

import com.roomrental.api.admin.dto.response.BackupResponse;

  
public interface BackupService {
    BackupResponse runBackup(Integer adminId);
}