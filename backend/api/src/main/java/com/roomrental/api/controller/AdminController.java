package com.roomrental.api.controller;

import com.roomrental.api.dto.request.admin.CreateInternalUserRequest;
import com.roomrental.api.dto.request.admin.UpdateInternalUserRequest;
import com.roomrental.api.dto.request.admin.UpdateUserStatusRequest;
import com.roomrental.api.dto.response.admin.AdminUserPageResponse;
import com.roomrental.api.dto.response.admin.AdminUserResponse;
import com.roomrental.api.dto.response.admin.BackupResponse;
import com.roomrental.api.dto.response.common.ApiResponse;
import com.roomrental.api.entity.User;
import com.roomrental.api.service.AdminService;
import com.roomrental.api.service.BackupService;
import com.roomrental.api.util.AuthHelper;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final AdminService adminService;
    private final BackupService backupService;
    private final AuthHelper authHelper;

    @PostMapping("/internal-users")
    public ResponseEntity<ApiResponse<AdminUserResponse>> createInternalUser(
            @Valid @RequestBody CreateInternalUserRequest request
    ) {
        AdminUserResponse response = adminService.createInternalUser(
                authHelper.getCurrentUserId(),
                request
        );

        return ResponseEntity.ok(ApiResponse.success("Tạo tài khoản nội bộ thành công", response));
    }

    @GetMapping("/internal-users")
    public ResponseEntity<ApiResponse<AdminUserPageResponse>> getInternalUsers(
            @RequestParam(required = false) String role,
            @RequestParam(required = false) User.UserStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        AdminUserPageResponse response = adminService.getInternalUsers(
                role,
                status,
                page,
                size
        );

        return ResponseEntity.ok(ApiResponse.success(
                "Lấy danh sách tài khoản nội bộ thành công",
                response
        ));
    }

    @PutMapping("/internal-users/{id}")
    public ResponseEntity<ApiResponse<AdminUserResponse>> updateInternalUser(
            @PathVariable Integer id,
            @Valid @RequestBody UpdateInternalUserRequest request
    ) {
        AdminUserResponse response = adminService.updateInternalUser(
                authHelper.getCurrentUserId(),
                id,
                request
        );

        return ResponseEntity.ok(ApiResponse.success(
                "Cập nhật tài khoản nội bộ thành công",
                response
        ));
    }

    @DeleteMapping("/internal-users/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteInternalUser(@PathVariable Integer id) {
        adminService.deleteInternalUser(authHelper.getCurrentUserId(), id);

        return ResponseEntity.ok(ApiResponse.success(
                "Xóa tài khoản nội bộ thành công",
                null
        ));
    }

    @GetMapping("/users")
    public ResponseEntity<ApiResponse<AdminUserPageResponse>> getUsers(
            @RequestParam(required = false) String role,
            @RequestParam(required = false) User.UserStatus status,
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        AdminUserPageResponse response = adminService.getUsers(
                role,
                status,
                keyword,
                page,
                size
        );

        return ResponseEntity.ok(ApiResponse.success(
                "Lấy danh sách tài khoản thành công",
                response
        ));
    }

    @PutMapping("/users/{id}/status")
    public ResponseEntity<ApiResponse<AdminUserResponse>> updateUserStatus(
            @PathVariable Integer id,
            @Valid @RequestBody UpdateUserStatusRequest request
    ) {
        AdminUserResponse response = adminService.updateUserStatus(
                authHelper.getCurrentUserId(),
                id,
                request
        );

        return ResponseEntity.ok(ApiResponse.success(
                "Cập nhật trạng thái tài khoản thành công",
                response
        ));
    }

    @PostMapping("/backups/run")
    public ResponseEntity<ApiResponse<BackupResponse>> runBackup() {
        BackupResponse response = backupService.runBackup(authHelper.getCurrentUserId());

        return ResponseEntity.ok(ApiResponse.success("Sao lưu dữ liệu thành công", response));
    }
}
