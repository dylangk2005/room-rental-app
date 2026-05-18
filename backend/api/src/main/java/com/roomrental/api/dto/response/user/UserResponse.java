package com.roomrental.api.dto.response.user;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class UserResponse {
    private Integer id;
    private String fullName;
    private String email;
    private String phoneNumber;
    private String avatar;
    private String status;
    private String role;
    private String membershipLevel;

}
