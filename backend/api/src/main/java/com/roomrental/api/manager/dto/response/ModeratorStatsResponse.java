package com.roomrental.api.manager.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ModeratorStatsResponse {
    private Integer moderatorId;
    private String moderatorName;
    private long approvedPosts;
    private long rejectedPosts;
    private long resolvedReports;
    private long rejectedReports;
    private long warnings;
    private long lockedPosts;
    private long bannedAccounts;
    private long totalActions;
}