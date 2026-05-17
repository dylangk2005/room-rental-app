package com.roomrental.api.dto.request.moderation;

import com.roomrental.api.entity.UserPenalty;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class BanUserRequest {

    @NotNull(message = "Loại xử lý không được để trống")
    private UserPenalty.PenaltyType type;

    @NotBlank(message = "Lý do xử lý không được để trống")
    private String reason;

    private Integer durationDays;
}