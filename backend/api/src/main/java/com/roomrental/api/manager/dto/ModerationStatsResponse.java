package com.roomrental.api.manager.dto;

import java.util.List;
import lombok.Builder;
import lombok.Data;

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