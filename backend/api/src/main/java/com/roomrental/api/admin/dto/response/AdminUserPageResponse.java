package com.roomrental.api.admin.dto.response;

import java.util.List;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class AdminUserPageResponse {
    private List<AdminUserResponse> users;
    private int currentPage;
    private int totalPages;
    private long totalElements;
}