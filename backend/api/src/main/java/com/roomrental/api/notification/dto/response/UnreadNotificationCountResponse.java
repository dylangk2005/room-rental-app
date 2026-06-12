package com.roomrental.api.notification.dto.response;

import com.roomrental.api.notification.entity.Notification;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UnreadNotificationCountResponse {

    private int unreadCount;
}
