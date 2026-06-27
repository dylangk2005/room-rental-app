package com.roomrental.api.moderation.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class HidePostRequest {

    @NotBlank(message = "Lý do không được để trống")
    private String reason;
}
