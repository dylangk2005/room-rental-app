package com.roomrental.api.service;

import com.roomrental.api.dto.request.user.UpdateUserProfileRequest;
import com.roomrental.api.dto.response.user.UserProfileResponse;
import org.springframework.web.multipart.MultipartFile;

public interface UserService {
    UserProfileResponse getProfile(Integer userId);
    UserProfileResponse updateProfile(Integer userId, UpdateUserProfileRequest request);
    UserProfileResponse updateAvatar(Integer userId, MultipartFile avatar);
}
