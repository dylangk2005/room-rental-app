package com.roomrental.api.dto.response.notification;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class NotificationPageResponse {

    private List<NotificationResponse> notifications;

    private int currentPage;

    private int totalPages;

    private long totalElements;
}