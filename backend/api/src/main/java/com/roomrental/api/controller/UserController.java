package com.roomrental.api.controller;

import com.roomrental.api.dto.request.user.UpdateUserProfileRequest;
import com.roomrental.api.dto.response.common.ApiResponse;
import com.roomrental.api.dto.response.user.UserProfileResponse;
import com.roomrental.api.service.UserService;
import com.roomrental.api.util.AuthHelper;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;
    private final AuthHelper authHelper;

    @GetMapping("/profile")
    public ResponseEntity<ApiResponse<UserProfileResponse>> getProfile() {
        return ResponseEntity.ok(ApiResponse.success("Lấy thông tin hồ sơ thành công", userService.getProfile(authHelper.getCurrentUserId())));
    }

    @PutMapping("/profile")
    public ResponseEntity<ApiResponse<UserProfileResponse>> updateProfile(
            @Valid @RequestBody UpdateUserProfileRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Cập nhật hồ sơ thành công", userService.updateProfile(authHelper.getCurrentUserId(), request)));
    }

    @PostMapping("/profile/avatar")
    public ResponseEntity<ApiResponse<UserProfileResponse>> updateAvatar(
            @RequestParam("avatar") MultipartFile avatar) {
        return ResponseEntity.ok(ApiResponse.success("Cập nhật ảnh đại diện thành công", userService.updateAvatar(authHelper.getCurrentUserId(), avatar)));
    }
}
