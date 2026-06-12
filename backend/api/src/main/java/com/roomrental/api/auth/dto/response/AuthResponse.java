package com.roomrental.api.auth.dto.response;

import com.roomrental.api.user.dto.response.UserResponse;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class AuthResponse {
    private String accessToken;
    private UserResponse user;
}
