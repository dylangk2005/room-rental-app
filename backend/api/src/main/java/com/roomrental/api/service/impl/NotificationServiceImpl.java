package com.roomrental.api.service.impl;

import com.roomrental.api.dto.response.notification.NotificationPageResponse;
import com.roomrental.api.dto.response.notification.NotificationResponse;
import com.roomrental.api.dto.response.notification.UnreadNotificationCountResponse;
import com.roomrental.api.entity.Notification;
import com.roomrental.api.entity.User;
import com.roomrental.api.exception.AppException;
import com.roomrental.api.repository.NotificationRepository;
import com.roomrental.api.repository.UserRepository;
import com.roomrental.api.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class NotificationServiceImpl implements NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional
    public void notifyUser(Integer userId, Notification.NotificationType type, String message) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> AppException.notFound("Không tìm thấy người dùng"));

        Notification notification = new Notification();
        notification.setUser(user);
        notification.setTitle(type);
        notification.setMessage(message);
        notification.setIsRead(false);
        notification.setCreatedAt(LocalDateTime.now());

        notificationRepository.save(notification);
    }

    @Override
    @Transactional
    public void notifyRole(String roleName, Notification.NotificationType type, String message) {
        List<User> users = userRepository.findByRole_Name(roleName);

        List<Notification> notifications = users.stream()
                .map(user -> {
                    Notification notification = new Notification();
                    notification.setUser(user);
                    notification.setTitle(type);
                    notification.setMessage(message);
                    notification.setIsRead(false);
                    notification.setCreatedAt(LocalDateTime.now());
                    return notification;
                })
                .toList();

        notificationRepository.saveAll(notifications);
    }

    @Override
    @Transactional(readOnly = true)
    public NotificationPageResponse getMyNotifications(Integer userId, int page, int size) {
        Pageable pageable = PageRequest.of(
                page,
                size,
                Sort.by(Sort.Order.desc("createdAt"))
        );

        Page<Notification> result = notificationRepository.findByUser_Id(userId, pageable);

        List<NotificationResponse> notifications = result.getContent()
                .stream()
                .map(this::mapResponse)
                .toList();

        return NotificationPageResponse.builder()
                .notifications(notifications)
                .currentPage(result.getNumber())
                .totalPages(result.getTotalPages())
                .totalElements(result.getTotalElements())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public UnreadNotificationCountResponse countUnread(Integer userId) {
        int unreadCount = notificationRepository.countByUser_IdAndIsRead(userId, false);

        return UnreadNotificationCountResponse.builder()
                .unreadCount(unreadCount)
                .build();
    }

    @Override
    @Transactional
    public void markAsRead(Integer userId, Integer notificationId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> AppException.notFound("Không tìm thấy thông báo"));

        if (!notification.getUser().getId().equals(userId)) {
            throw AppException.forbidden("Bạn không có quyền cập nhật thông báo này");
        }

        notification.setIsRead(true);
    }

    @Override
    @Transactional
    public void markAllAsRead(Integer userId) {
        Pageable pageable = PageRequest.of(
                0,
                1000,
                Sort.by(Sort.Order.desc("createdAt"))
        );

        Page<Notification> result = notificationRepository.findByUser_Id(userId, pageable);

        List<Notification> unreadNotifications = result.getContent()
                .stream()
                .filter(notification -> !Boolean.TRUE.equals(notification.getIsRead()))
                .peek(notification -> notification.setIsRead(true))
                .toList();

        notificationRepository.saveAll(unreadNotifications);
    }

    private NotificationResponse mapResponse(Notification notification) {
        return NotificationResponse.builder()
                .id(notification.getId())
                .type(notification.getTitle() != null ? notification.getTitle().name() : null)
                .message(notification.getMessage())
                .isRead(notification.getIsRead())
                .createdAt(notification.getCreatedAt())
                .build();
    }
}