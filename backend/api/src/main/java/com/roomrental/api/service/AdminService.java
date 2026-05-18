package com.roomrental.api.service;

import com.roomrental.api.dto.request.admin.CreateInternalUserRequest;
import com.roomrental.api.dto.response.admin.InternalUserResponse;

public interface AdminService {
    InternalUserResponse createInternalUser(Integer adminId, CreateInternalUserRequest request);
}