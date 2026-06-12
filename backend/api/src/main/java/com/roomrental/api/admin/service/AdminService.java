package com.roomrental.api.admin.service;

import com.roomrental.api.admin.dto.response.AdminUserPageResponse;
import com.roomrental.api.admin.dto.response.AdminUserResponse;
import com.roomrental.api.admin.dto.request.CreateInternalUserRequest;
import com.roomrental.api.admin.dto.request.UpdateInternalUserRequest;
import com.roomrental.api.admin.dto.request.UpdateUserStatusRequest;
import com.roomrental.api.user.entity.Role;
import com.roomrental.api.user.entity.User;

public interface AdminService {
    // Tạo tài khoản nội bộ (manager, moderator)
    AdminUserResponse createInternalUser(Integer adminId, CreateInternalUserRequest request);

    AdminUserResponse updateInternalUser(
            Integer adminId,
            Integer userId,
            UpdateInternalUserRequest request
    );

    void deleteInternalUser(Integer adminId, Integer userId);

    // Lấy danh sách tài khoản nội bộ với phân trang
    AdminUserPageResponse getInternalUsers(
            String role,
            User.UserStatus status,
            int page,
            int size
    );

    // Cập nhật trạng thái tài khoản (khoá, mở khóa)
    AdminUserResponse updateUserStatus(
            Integer adminId,
            Integer userId,
            UpdateUserStatusRequest request
    );

    // Lấy danh sách tài khoản với phân trang
    AdminUserPageResponse getUsers(
            String role,
            User.UserStatus status,
            String keyword,
            int page,
            int size
    );
}