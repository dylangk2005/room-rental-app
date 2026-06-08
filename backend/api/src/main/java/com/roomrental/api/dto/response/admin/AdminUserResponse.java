package com.roomrental.api.dto.response.admin;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class AdminUserResponse {
    private Integer id;
    private String fullName;
    private String email;
    private String phoneNumber;
    private String status;
    private String role;
    private LocalDateTime createdAt;
    private List<ActivePenaltyResponse> activePenalties;

    @Data
    @Builder
    public static class ActivePenaltyResponse {
        private Integer id;
        private String type;
        private String reason;
        private LocalDateTime startDate;
        private LocalDateTime endDate;
        private LocalDateTime createdAt;
    }
}
