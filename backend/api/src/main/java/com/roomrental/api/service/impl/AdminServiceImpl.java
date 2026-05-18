package com.roomrental.api.service.impl;

import com.roomrental.api.dto.request.admin.CreateInternalUserRequest;
import com.roomrental.api.dto.response.admin.InternalUserPageResponse;
import com.roomrental.api.dto.response.admin.InternalUserResponse;
import com.roomrental.api.entity.AuditLog;
import com.roomrental.api.entity.Role;
import com.roomrental.api.entity.User;
import com.roomrental.api.exception.AppException;
import com.roomrental.api.repository.RoleRepository;
import com.roomrental.api.repository.UserRepository;
import com.roomrental.api.service.AdminService;
import com.roomrental.api.service.AuditLogService;
import com.roomrental.api.service.EmailService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class AdminServiceImpl implements AdminService {

    private static final Set<String> INTERNAL_ROLES = Set.of("ADMIN", "MANAGER", "MODERATOR");
    private static final String PASSWORD_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$%";
    private static final int TEMP_PASSWORD_LENGTH = 12;

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;
    private final AuditLogService auditLogService;

    @Override
    @Transactional
    public InternalUserResponse createInternalUser(Integer adminId, CreateInternalUserRequest request) {
        String roleName = request.getRole().trim().toUpperCase();

        if (!INTERNAL_ROLES.contains(roleName)) {
            throw AppException.badRequest("Chỉ được tạo tài khoản nội bộ với vai trò ADMIN, MANAGER hoặc MODERATOR");
        }

        if (userRepository.existsByEmail(request.getEmail())) {
            throw AppException.badRequest("Email đã tồn tại");
        }

        if (userRepository.existsByPhoneNumber(request.getPhoneNumber())) {
            throw AppException.badRequest("Số điện thoại đã tồn tại");
        }

        Role role = roleRepository.findByName(roleName)
                .orElseThrow(() -> AppException.notFound("Vai trò không tồn tại"));

        String temporaryPassword = generateTemporaryPassword();

        User user = new User();
        user.setFullName(request.getFullName());
        user.setEmail(request.getEmail());
        user.setPhoneNumber(request.getPhoneNumber());
        user.setPassword(passwordEncoder.encode(temporaryPassword));
        user.setStatus(User.UserStatus.ACTIVE);
        user.setRole(role);
        user.setMembershipLevel(null);
        user.setCreatedAt(LocalDateTime.now());
        user.setMustChangePassword(true);

        User savedUser = userRepository.save(user);

        emailService.sendInternalAccountCredentials(
                savedUser.getEmail(),
                savedUser.getFullName(),
                roleName,
                temporaryPassword
        );

        auditLogService.log(
                adminId,
                "CREATE_INTERNAL_USER",
                AuditLog.TargetType.USER,
                savedUser.getId(),
                "Admin #" + adminId + " tạo tài khoản nội bộ #" + savedUser.getId()
                        + " với vai trò " + roleName + "."
        );

        return mapResponse(savedUser);
    }

    @Override
    @Transactional(readOnly = true)
    public InternalUserPageResponse getInternalUsers(
            String role,
            User.UserStatus status,
            int page,
            int size
    ) {
        String roleName = role != null && !role.isBlank()
                ? role.trim().toUpperCase()
                : null;

        if (roleName != null && !INTERNAL_ROLES.contains(roleName)) {
            throw AppException.badRequest("Vai trò nội bộ không hợp lệ");
        }

        Page<User> result = userRepository.findInternalUsers(
                List.copyOf(INTERNAL_ROLES),
                roleName,
                status,
                PageRequest.of(page, size, Sort.by(Sort.Order.desc("createdAt")))
        );

        return InternalUserPageResponse.builder()
                .users(result.getContent().stream().map(this::mapResponse).toList())
                .currentPage(result.getNumber())
                .totalPages(result.getTotalPages())
                .totalElements(result.getTotalElements())
                .build();
    }

    private String generateTemporaryPassword() {
        SecureRandom random = new SecureRandom();
        StringBuilder password = new StringBuilder();

        for (int i = 0; i < TEMP_PASSWORD_LENGTH; i++) {
            int index = random.nextInt(PASSWORD_CHARS.length());
            password.append(PASSWORD_CHARS.charAt(index));
        }

        return password.toString();
    }

    private InternalUserResponse mapResponse(User user) {
        return InternalUserResponse.builder()
                .id(user.getId())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .phoneNumber(user.getPhoneNumber())
                .avatar(user.getAvatar())
                .status(user.getStatus() != null ? user.getStatus().name() : null)
                .role(user.getRole() != null ? user.getRole().getName() : null)
                .createdAt(user.getCreatedAt())
                .build();
    }
}