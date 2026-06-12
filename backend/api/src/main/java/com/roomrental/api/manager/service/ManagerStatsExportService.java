package com.roomrental.api.manager.service;

import com.roomrental.api.manager.dto.StatsExportType;
import java.time.LocalDate;

public interface ManagerStatsExportService {
    byte[] exportStats(StatsExportType type, LocalDate from, LocalDate to);
}