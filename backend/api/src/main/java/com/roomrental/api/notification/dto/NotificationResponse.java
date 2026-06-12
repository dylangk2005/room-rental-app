package com.roomrental.api.notification.dto;

import com.roomrental.api.notification.entity.Notification;
import java.time.LocalDateTime;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class NotificationResponse {

    private Integer id;

    private String type;

    private String message;

    private Boolean isRead;

    private LocalDateTime createdAt;
}