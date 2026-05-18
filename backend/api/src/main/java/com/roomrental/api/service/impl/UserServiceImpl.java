package com.roomrental.api.service.impl;

import com.roomrental.api.dto.request.user.UpdateUserProfileRequest;
import com.roomrental.api.dto.response.user.UserProfileResponse;
import com.roomrental.api.entity.User;
import com.roomrental.api.exception.AppException;
import com.roomrental.api.repository.UserRepository;
import com.roomrental.api.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;

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