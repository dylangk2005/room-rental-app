package com.roomrental.api.dto.response.user;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
public class UserProfileResponse {
    private Integer id;
    private String fullName;
    private String email;
    private String phoneNumber;
    private String avatar;
    private String status;
    private String role;
    private String membershipLevel;
    private BigDecimal accountBalance;
    private BigDecimal totalSpent;
    private LocalDateTime createdAt;
}