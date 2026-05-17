package com.roomrental.api.service;

import com.roomrental.api.dto.request.manager.StatsExportType;

import java.time.LocalDate;

public interface ManagerStatsExportService {
    byte[] exportStats(StatsExportType type, LocalDate from, LocalDate to);
}