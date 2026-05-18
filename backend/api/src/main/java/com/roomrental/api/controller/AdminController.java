package com.roomrental.api.controller;

import com.roomrental.api.dto.request.admin.CreateInternalUserRequest;
import com.roomrental.api.dto.response.admin.InternalUserResponse;
import com.roomrental.api.dto.response.common.ApiResponse;
import com.roomrental.api.service.AdminService;
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
    private final AuthHelper authHelper;

    @PostMapping("/internal-users")
    public ResponseEntity<ApiResponse<InternalUserResponse>> createInternalUser(
            @Valid @RequestBody CreateInternalUserRequest request
    ) {
        InternalUserResponse response = adminService.createInternalUser(
                authHelper.getCurrentUserId(),
                request
        );

        return ResponseEntity.ok(ApiResponse.success("Tạo tài khoản nội bộ thành công", response));
    }
}