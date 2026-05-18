package com.roomrental.api.dto.response.admin;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class InternalUserPageResponse {
    private List<InternalUserResponse> users;
    private int currentPage;
    private int totalPages;
    private long totalElements;
}