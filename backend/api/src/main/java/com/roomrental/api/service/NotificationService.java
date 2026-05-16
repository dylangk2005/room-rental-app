package com.roomrental.api.service;

import com.roomrental.api.dto.response.notification.NotificationPageResponse;
import com.roomrental.api.dto.response.notification.UnreadNotificationCountResponse;
import com.roomrental.api.entity.Notification;

public interface NotificationService {

    void notifyUser(Integer userId, Notification.NotificationType type, String message); // Gửi thông báo đến người dùng cụ thể

    void notifyRole(String roleName, Notification.NotificationType type, String message); // Gửi thông báo đến tất cả người dùng có vai trò cụ thể

    NotificationPageResponse getMyNotifications(Integer userId, int page, int size); // Lấy danh sách thông báo của người dùng với phân trang

    UnreadNotificationCountResponse countUnread(Integer userId); // Đếm số lượng thông báo chưa đọc của người dùng

    void markAsRead(Integer userId, Integer notificationId); // Đánh dấu một thông báo cụ thể là đã đọc

    void markAllAsRead(Integer userId); // Đánh dấu tất cả thông báo của người dùng là đã đọc
}