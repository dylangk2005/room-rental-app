package com.roomrental.api.dto.response.admin;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class InternalUserResponse {
    private Integer id;
    private String fullName;
    private String email;
    private String phoneNumber;
    private String avatar;
    private String status;
    private String role;
    private LocalDateTime createdAt;
}