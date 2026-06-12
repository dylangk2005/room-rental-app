package com.roomrental.api.notification.dto;

import com.roomrental.api.notification.entity.Notification;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class UnreadNotificationCountResponse {

    private int unreadCount;
}