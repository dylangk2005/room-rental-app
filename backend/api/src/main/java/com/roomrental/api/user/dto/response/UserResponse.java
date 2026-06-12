package com.roomrental.api.user.dto.response;

import com.roomrental.api.pricing.entity.MembershipLevel;
import com.roomrental.api.user.entity.Role;
import com.roomrental.api.user.entity.User;
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

    private Boolean mustChangePassword;
}