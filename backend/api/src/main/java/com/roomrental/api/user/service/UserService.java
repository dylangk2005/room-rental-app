package com.roomrental.api.user.service;

import com.roomrental.api.user.dto.UpdateUserProfileRequest;
import com.roomrental.api.user.dto.UserProfileResponse;
import com.roomrental.api.user.entity.User;
import org.springframework.web.multipart.MultipartFile;

public interface UserService {
    UserProfileResponse getProfile(Integer userId);
    UserProfileResponse updateProfile(Integer userId, UpdateUserProfileRequest request);
    UserProfileResponse updateAvatar(Integer userId, MultipartFile avatar);
}