package com.roomrental.api.manager.controller;

import com.roomrental.api.common.dto.ApiResponse;
import com.roomrental.api.common.util.AuthHelper;
import com.roomrental.api.manager.service.ManagerService;
import com.roomrental.api.post.entity.Post;
import com.roomrental.api.pricing.dto.UpdateMembershipLevelRequest;
import com.roomrental.api.pricing.dto.UpdatePostTypePriceRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/manager")
@RequiredArgsConstructor
public class ManagerController {

    private final ManagerService managerService;
    private final AuthHelper authHelper;

    @PutMapping("/users/{id}/unban")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<ApiResponse<Void>> unbanUser(@PathVariable Integer id) {
        managerService.unbanUser(authHelper.getCurrentUserId(), id);
        return ResponseEntity.ok(ApiResponse.success("Mở khóa tài khoản thành công", null));
    }

    @PutMapping("/post-type-prices")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<ApiResponse<Void>> updatePostTypePrice(
            @Valid @RequestBody UpdatePostTypePriceRequest request) {

        managerService.updatePostTypePrice(authHelper.getCurrentUserId(), request);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật giá đăng tin thành công", null));
    }

    @PutMapping("/membership-levels/{id}")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<ApiResponse<Void>> updateMembershipLevel(
            @PathVariable Integer id,
            @Valid @RequestBody UpdateMembershipLevelRequest request) {

        managerService.updateMembershipLevel(authHelper.getCurrentUserId(), id, request);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật hạng thành viên thành công", null));
    }
}