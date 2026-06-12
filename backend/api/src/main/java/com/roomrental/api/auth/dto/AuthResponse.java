package com.roomrental.api.auth.dto;

import com.roomrental.api.user.dto.UserResponse;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class AuthResponse {
    private String accessToken;
    private UserResponse user;
}
