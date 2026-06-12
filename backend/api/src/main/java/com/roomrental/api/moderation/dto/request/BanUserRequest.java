package com.roomrental.api.moderation.dto.request;

import com.roomrental.api.user.entity.UserPenalty;
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