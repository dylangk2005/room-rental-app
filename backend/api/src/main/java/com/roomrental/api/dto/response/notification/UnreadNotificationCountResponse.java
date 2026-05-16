package com.roomrental.api.dto.response.notification;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class UnreadNotificationCountResponse {

    private int unreadCount;
}