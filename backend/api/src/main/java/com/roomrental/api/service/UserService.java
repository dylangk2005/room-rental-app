package com.roomrental.api.service;

import com.roomrental.api.dto.request.user.UpdateUserProfileRequest;
import com.roomrental.api.dto.response.user.UserProfileResponse;

public interface UserService {
    UserProfileResponse getProfile(Integer userId);
    UserProfileResponse updateProfile(Integer userId, UpdateUserProfileRequest request);
}