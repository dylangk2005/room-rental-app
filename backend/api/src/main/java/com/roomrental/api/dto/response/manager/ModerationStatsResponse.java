package com.roomrental.api.dto.response.manager;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class ModerationStatsResponse {
    private long approvedPosts;
    private long rejectedPosts;
    private long resolvedReports;
    private long rejectedReports;
    private long warnings;
    private long lockedPosts;
    private long bannedAccounts;
    private long totalActions;
    private List<ModeratorStatsResponse> byModerator;
}