package com.roomrental.api.service;

import com.roomrental.api.dto.request.admin.CreateInternalUserRequest;
import com.roomrental.api.dto.request.admin.UpdateInternalUserRequest;
import com.roomrental.api.dto.request.admin.UpdateUserStatusRequest;
import com.roomrental.api.dto.response.admin.AdminUserResponse;
import com.roomrental.api.dto.response.admin.AdminUserPageResponse;
import com.roomrental.api.entity.User;

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
