package com.roomrental.api.user.service.impl;

import com.roomrental.api.common.exception.AppException;
import com.roomrental.api.integration.service.CloudinaryService;
import com.roomrental.api.pricing.entity.MembershipLevel;
import com.roomrental.api.user.dto.UpdateUserProfileRequest;
import com.roomrental.api.user.dto.UserProfileResponse;
import com.roomrental.api.user.entity.Role;
import com.roomrental.api.user.entity.User;
import com.roomrental.api.user.repository.UserRepository;
import com.roomrental.api.user.service.UserService;
import java.math.BigDecimal;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final CloudinaryService cloudinaryService;

    @Override
    public UserProfileResponse getProfile(Integer userId) {
        User user = getUser(userId);
        return mapProfile(user);
    }

    @Override
    @Transactional
    public UserProfileResponse updateProfile(Integer userId, UpdateUserProfileRequest request) {
        User user = getUser(userId);

        if (userRepository.existsByPhoneNumberAndIdNot(request.getPhoneNumber(), userId)) {
            throw AppException.badRequest("Số điện thoại đã tồn tại");
        }

        user.setFullName(request.getFullName());
        user.setPhoneNumber(request.getPhoneNumber());
        user.setAvatar(request.getAvatar());

        return mapProfile(user);
    }

    @Override
    @Transactional
    public UserProfileResponse updateAvatar(Integer userId, MultipartFile avatar) {
        if (avatar == null || avatar.isEmpty()) {
            throw AppException.badRequest("Vui lòng chọn ảnh đại diện");
        }

        User user = getUser(userId);
        String avatarUrl = cloudinaryService.uploadImage(avatar);
        user.setAvatar(avatarUrl);

        return mapProfile(user);
    }

    private User getUser(Integer userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> AppException.notFound("Không tìm thấy người dùng"));
    }

    private UserProfileResponse mapProfile(User user) {
        return UserProfileResponse.builder()
                .id(user.getId())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .phoneNumber(user.getPhoneNumber())
                .avatar(user.getAvatar())
                .status(user.getStatus() != null ? user.getStatus().name() : null)
                .role(user.getRole() != null ? user.getRole().getName() : null)
                .membershipLevel(user.getMembershipLevel() != null ? user.getMembershipLevel().getName() : null)
                .accountBalance(user.getAccountBalance() != null ? user.getAccountBalance() : BigDecimal.ZERO)
                .totalSpent(user.getTotalSpent() != null ? user.getTotalSpent() : BigDecimal.ZERO)
                .createdAt(user.getCreatedAt())
                .build();
    }
}