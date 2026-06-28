package com.roomrental.api.admin.dto.response;

import com.roomrental.api.user.entity.Role;
import java.time.LocalDateTime;
import java.util.List;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class AdminUserResponse {
    private Integer id;
    private String fullName;
    private String email;
    private String phoneNumber;
    private String status;
    private String role;
    private String avatar;
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
        private Boolean isActive;
        private LocalDateTime createdAt;
    }
}