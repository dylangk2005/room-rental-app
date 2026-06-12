package com.roomrental.api.notification.controller;

import com.roomrental.api.common.dto.ApiResponse;
import com.roomrental.api.common.util.AuthHelper;
import com.roomrental.api.notification.dto.response.NotificationPageResponse;
import com.roomrental.api.notification.dto.response.UnreadNotificationCountResponse;
import com.roomrental.api.notification.entity.Notification;
import com.roomrental.api.notification.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
@PreAuthorize("isAuthenticated()")
public class NotificationController {

    private final NotificationService notificationService;
    private final AuthHelper authHelper;

    @GetMapping
    public ResponseEntity<ApiResponse<NotificationPageResponse>> getMyNotifications(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(ApiResponse.success(
                notificationService.getMyNotifications(authHelper.getCurrentUserId(), page, size)
        ));
    }

    @GetMapping("/unread-count")
    public ResponseEntity<ApiResponse<UnreadNotificationCountResponse>> countUnread() {
        return ResponseEntity.ok(ApiResponse.success(
                notificationService.countUnread(authHelper.getCurrentUserId())
        ));
    }

    @PutMapping("/{id}/read")
    public ResponseEntity<ApiResponse<Void>> markAsRead(@PathVariable Integer id) {
        notificationService.markAsRead(authHelper.getCurrentUserId(), id);
        return ResponseEntity.ok(ApiResponse.success("Đã đánh dấu thông báo là đã đọc", null));
    }

    @PutMapping("/read-all")
    public ResponseEntity<ApiResponse<Void>> markAllAsRead() {
        notificationService.markAllAsRead(authHelper.getCurrentUserId());
        return ResponseEntity.ok(ApiResponse.success("Đã đánh dấu tất cả thông báo là đã đọc", null));
    }
}