package com.roomrental.api.manager.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class UserStatsResponse {
    private long totalUsers;
    private long newUsers;
    private long activeUsers;
    private long inactiveUsers;
    private long bannedUsers;
}