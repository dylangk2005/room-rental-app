package com.roomrental.api.admin.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class DashboardStatsResponse {

    private long totalUsers;
    private long internalAccounts;
    private long activeAccounts;
    private long todayLogs;
}
