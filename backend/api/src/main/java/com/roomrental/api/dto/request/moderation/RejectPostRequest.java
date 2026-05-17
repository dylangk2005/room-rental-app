package com.roomrental.api.dto.request.moderation;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class RejectPostRequest {

    @NotBlank(message = "Lý do từ chối không được để trống")
    private String reason;
}