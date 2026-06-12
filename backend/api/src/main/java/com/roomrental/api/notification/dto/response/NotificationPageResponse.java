package com.roomrental.api.notification.dto.response;

import com.roomrental.api.notification.entity.Notification;
import java.util.List;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class NotificationPageResponse {

    private List<NotificationResponse> notifications;

    private int currentPage;

    private int totalPages;

    private long totalElements;
}