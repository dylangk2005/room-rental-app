package com.roomrental.api.admin.service.impl;

import com.roomrental.api.admin.dto.response.AdminUserPageResponse;
import com.roomrental.api.admin.dto.response.AdminUserResponse;
import com.roomrental.api.admin.dto.response.DashboardStatsResponse;
import com.roomrental.api.admin.dto.request.CreateInternalUserRequest;
import com.roomrental.api.admin.dto.request.UpdateInternalUserRequest;
import com.roomrental.api.admin.dto.request.UpdateUserStatusRequest;
import com.roomrental.api.admin.entity.AuditLog;
import com.roomrental.api.admin.repository.AuditLogRepository;
import com.roomrental.api.admin.service.AdminService;
import com.roomrental.api.admin.service.AuditLogService;
import com.roomrental.api.common.exception.AppException;
import com.roomrental.api.integration.service.EmailService;
import com.roomrental.api.user.entity.Role;
import com.roomrental.api.user.entity.User;
import com.roomrental.api.user.repository.RoleRepository;
import com.roomrental.api.user.repository.UserRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AdminServiceImpl implements AdminService {

    private static final Set<String> INTERNAL_ROLES = Set.of("ADMIN", "MANAGER", "MODERATOR");
    private static final String DEFAULT_INTERNAL_PASSWORD = "123456aA@";

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;
    private final AuditLogService auditLogService;
    private final AuditLogRepository auditLogRepository;

    @PersistenceContext
    private EntityManager entityManager;

    @Override
    @Transactional(readOnly = true)
    public DashboardStatsResponse getDashboardStats() {
        LocalDateTime startOfDay = LocalDateTime.now().toLocalDate().atStartOfDay();

        return DashboardStatsResponse.builder()
                .totalUsers(userRepository.count())
                .internalAccounts(userRepository.countInternalUsers(List.copyOf(INTERNAL_ROLES)))
                .activeAccounts(userRepository.countByStatusAndRole(User.UserStatus.ACTIVE, null))
                .todayLogs(auditLogRepository.countByCreatedAtBetween(startOfDay, LocalDateTime.now()))
                .build();
    }

    // Tạo tài khoản nội bộ (manager, moderator)
    @Override
    @Transactional
    public AdminUserResponse createInternalUser(Integer adminId, CreateInternalUserRequest request) {
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

        User user = new User();
        user.setFullName(request.getFullName());
        user.setEmail(request.getEmail());
        user.setPhoneNumber(request.getPhoneNumber());
        user.setPassword(passwordEncoder.encode(DEFAULT_INTERNAL_PASSWORD));
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
                DEFAULT_INTERNAL_PASSWORD
        );

        auditLogService.log(
                adminId,
                "CREATE_INTERNAL_USER",
                AuditLog.TargetType.USER,
                savedUser.getId(),
                "Quản trị viên #" + adminId + " tạo tài khoản nội bộ #" + savedUser.getId()
                        + " với vai trò " + roleName + "."
        );

        return mapResponse(savedUser);
    }

    @Override
    @Transactional(readOnly = true)
    public AdminUserPageResponse getInternalUsers(
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

        return AdminUserPageResponse.builder()
                .users(result.getContent().stream().map(this::mapResponse).toList())
                .currentPage(result.getNumber())
                .totalPages(result.getTotalPages())
                .totalElements(result.getTotalElements())
                .build();
    }

    @Override
    @Transactional
    public AdminUserResponse updateInternalUser(
            Integer adminId,
            Integer userId,
            UpdateInternalUserRequest request
    ) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> AppException.notFound("Không tìm thấy tài khoản nội bộ"));

        String currentRoleName = user.getRole() != null ? user.getRole().getName() : null;
        if (!INTERNAL_ROLES.contains(currentRoleName)) {
            throw AppException.badRequest("Chỉ được cập nhật tài khoản nội bộ");
        }

        StringBuilder changes = new StringBuilder();

        if (hasText(request.getFullName())) {
            String nextFullName = request.getFullName().trim();
            if (!nextFullName.equals(user.getFullName())) {
                user.setFullName(nextFullName);
                changes.append("fullName; ");
            }
        }

        if (hasText(request.getEmail())) {
            String nextEmail = request.getEmail().trim();
            if (!nextEmail.equalsIgnoreCase(user.getEmail())) {
                if (userRepository.existsByEmailAndIdNot(nextEmail, user.getId())) {
                    throw AppException.badRequest("Email đã tồn tại");
                }
                user.setEmail(nextEmail);
                changes.append("email; ");
            }
        }

        if (hasText(request.getPhoneNumber())) {
            String nextPhoneNumber = request.getPhoneNumber().trim();
            if (!nextPhoneNumber.equals(user.getPhoneNumber())) {
                if (userRepository.existsByPhoneNumberAndIdNot(nextPhoneNumber, user.getId())) {
                    throw AppException.badRequest("Số điện thoại đã tồn tại");
                }
                user.setPhoneNumber(nextPhoneNumber);
                changes.append("phoneNumber; ");
            }
        }

        if (hasText(request.getPassword())) {
            user.setPassword(passwordEncoder.encode(request.getPassword()));
            user.setMustChangePassword(true);
            changes.append("password; ");
        }

        if (hasText(request.getRole())) {
            String nextRoleName = request.getRole().trim().toUpperCase();
            if (!INTERNAL_ROLES.contains(nextRoleName)) {
                throw AppException.badRequest("Vai trò nội bộ không hợp lệ");
            }
            if (!nextRoleName.equals(currentRoleName)) {
                Role role = roleRepository.findByName(nextRoleName)
                        .orElseThrow(() -> AppException.notFound("Vai trò không tồn tại"));
                user.setRole(role);
                changes.append("role; ");
            }
        }

        if (request.getStatus() != null && request.getStatus() != user.getStatus()) {
            if (adminId.equals(userId) && request.getStatus() == User.UserStatus.BANNED) {
                throw AppException.badRequest("Không thể tự khóa tài khoản của chính mình");
            }
            user.setStatus(request.getStatus());
            changes.append("status; ");
        }

        if (changes.isEmpty()) {
            throw AppException.badRequest("Không có thông tin nào để cập nhật");
        }

        User savedUser = userRepository.save(user);

        auditLogService.log(
                adminId,
                "UPDATE_INTERNAL_USER",
                AuditLog.TargetType.USER,
                savedUser.getId(),
                "Quản trị viên #" + adminId + " cập nhật tài khoản nội bộ #"
                        + savedUser.getId() + ". Trường thay đổi: " + changes
        );

        return mapResponse(savedUser);
    }

    @Override
    @Transactional
    public void deleteInternalUser(Integer adminId, Integer userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> AppException.notFound("Không tìm thấy tài khoản nội bộ"));

        String roleName = user.getRole() != null ? user.getRole().getName() : null;
        if (!INTERNAL_ROLES.contains(roleName)) {
            throw AppException.badRequest("Chỉ được xóa tài khoản nội bộ");
        }

        if (adminId.equals(userId)) {
            throw AppException.badRequest("Không thể xóa tài khoản của chính mình");
        }

        auditLogService.log(
                adminId,
                "DELETE_INTERNAL_USER",
                AuditLog.TargetType.USER,
                userId,
                "Quản trị viên #" + adminId + " xóa tài khoản nội bộ #" + userId
        );

        forceDeleteUserGraph(userId);
    }

    private void forceDeleteUserGraph(Integer userId) {
        entityManager.createNativeQuery("""
                DELETE ri FROM report_images ri
                JOIN reports r ON ri.report_id = r.id
                LEFT JOIN posts p ON r.post_id = p.id
                WHERE r.user_id = :userId OR r.moderator_id = :userId OR p.user_id = :userId
                """)
                .setParameter("userId", userId)
                .executeUpdate();

        entityManager.createNativeQuery("""
                DELETE r FROM reports r
                LEFT JOIN posts p ON r.post_id = p.id
                WHERE r.user_id = :userId OR r.moderator_id = :userId OR p.user_id = :userId
                """)
                .setParameter("userId", userId)
                .executeUpdate();

        entityManager.createNativeQuery("""
                DELETE pi FROM post_images pi
                JOIN posts p ON pi.post_id = p.id
                WHERE p.user_id = :userId
                """)
                .setParameter("userId", userId)
                .executeUpdate();

        entityManager.createNativeQuery("""
                DELETE f FROM favorites f
                LEFT JOIN posts p ON f.post_id = p.id
                WHERE f.user_id = :userId OR p.user_id = :userId
                """)
                .setParameter("userId", userId)
                .executeUpdate();

        entityManager.createNativeQuery("DELETE FROM payments WHERE user_id = :userId OR post_id IN (SELECT id FROM posts WHERE user_id = :userId)")
                .setParameter("userId", userId)
                .executeUpdate();

        entityManager.createNativeQuery("DELETE FROM posts WHERE user_id = :userId")
                .setParameter("userId", userId)
                .executeUpdate();

        entityManager.createNativeQuery("DELETE FROM deposits WHERE user_id = :userId")
                .setParameter("userId", userId)
                .executeUpdate();

        entityManager.createNativeQuery("DELETE FROM user_penalties WHERE user_id = :userId")
                .setParameter("userId", userId)
                .executeUpdate();

        entityManager.createNativeQuery("DELETE FROM moderation_logs WHERE user_id = :userId")
                .setParameter("userId", userId)
                .executeUpdate();

        entityManager.createNativeQuery("DELETE FROM audit_logs WHERE user_id = :userId")
                .setParameter("userId", userId)
                .executeUpdate();

        entityManager.createNativeQuery("DELETE FROM notifications WHERE user_id = :userId")
                .setParameter("userId", userId)
                .executeUpdate();

        entityManager.createNativeQuery("DELETE FROM users WHERE id = :userId")
                .setParameter("userId", userId)
                .executeUpdate();
    }

    @Override
    @Transactional
    public AdminUserResponse updateUserStatus(
            Integer adminId,
            Integer userId,
            UpdateUserStatusRequest request
    ) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> AppException.notFound("Không tìm thấy tài khoản"));

        String roleName = user.getRole() != null ? user.getRole().getName() : null;

        if ("ADMIN".equals(roleName)) {
            throw AppException.badRequest("Không thể cập nhật trạng thái tài khoản ADMIN");
        }

        if (adminId.equals(userId) && request.getStatus() == User.UserStatus.BANNED) {
            throw AppException.badRequest("Không thể tự khóa tài khoản của chính mình");
        }

        User.UserStatus oldStatus = user.getStatus();
        user.setStatus(request.getStatus());

        auditLogService.log(
                adminId,
                "UPDATE_USER_STATUS",
                AuditLog.TargetType.USER,
                user.getId(),
                "Quản trị viên #" + adminId + " cập nhật trạng thái tài khoản #"
                        + user.getId() + " từ " + oldStatus + " sang " + request.getStatus() + "."
        );

        return mapResponse(user);
    }

    @Override
    @Transactional(readOnly = true)
    public AdminUserPageResponse getUsers(
            String role,
            User.UserStatus status,
            String keyword,
            int page,
            int size
    ) {
        String roleName = role != null && !role.isBlank()
                ? role.trim().toUpperCase()
                : null;

        String searchKeyword = keyword != null && !keyword.isBlank()
                ? keyword.trim()
                : null;

        Page<User> result = userRepository.searchAdminUsers(
                roleName,
                status,
                searchKeyword,
                PageRequest.of(page, size, Sort.by(Sort.Order.desc("createdAt")))
        );

        return AdminUserPageResponse.builder()
                .users(result.getContent().stream().map(this::mapResponse).toList())
                .currentPage(result.getNumber())
                .totalPages(result.getTotalPages())
                .totalElements(result.getTotalElements())
                .build();
    }

    private boolean hasText(String value) {
        return value != null && !value.isBlank();
    }

    private AdminUserResponse mapResponse(User user) {
        return AdminUserResponse.builder()
                .id(user.getId())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .phoneNumber(user.getPhoneNumber())
                .status(user.getStatus() != null ? user.getStatus().name() : null)
                .role(user.getRole() != null ? user.getRole().getName() : null)
                .createdAt(user.getCreatedAt())
                .build();
    }
}
