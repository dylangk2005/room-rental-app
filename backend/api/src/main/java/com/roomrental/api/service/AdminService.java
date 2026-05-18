package com.roomrental.api.service;

import com.roomrental.api.dto.request.admin.CreateInternalUserRequest;
import com.roomrental.api.dto.request.admin.UpdateUserStatusRequest;
import com.roomrental.api.dto.response.admin.AdminUserResponse;
import com.roomrental.api.dto.response.admin.AdminUserPageResponse;
import com.roomrental.api.entity.User;

public interface AdminService {
    AdminUserResponse createInternalUser(Integer adminId, CreateInternalUserRequest request);

    AdminUserPageResponse getInternalUsers(
            String role,
            User.UserStatus status,
            int page,
            int size
    );

    AdminUserResponse updateUserStatus(
            Integer adminId,
            Integer userId,
            UpdateUserStatusRequest request
    );

    AdminUserPageResponse getUsers(
            String role,
            User.UserStatus status,
            String keyword,
            int page,
            int size
    );
}