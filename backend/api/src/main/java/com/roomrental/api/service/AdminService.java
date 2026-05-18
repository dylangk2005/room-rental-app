package com.roomrental.api.service;

import com.roomrental.api.dto.request.admin.CreateInternalUserRequest;
import com.roomrental.api.dto.response.admin.InternalUserPageResponse;
import com.roomrental.api.dto.response.admin.InternalUserResponse;
import com.roomrental.api.entity.User;

public interface AdminService {
    InternalUserResponse createInternalUser(Integer adminId, CreateInternalUserRequest request);

    InternalUserPageResponse getInternalUsers(
            String role,
            User.UserStatus status,
            int page,
            int size
    );
}