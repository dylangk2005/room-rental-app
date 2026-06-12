package com.roomrental.api.admin.dto;

import com.roomrental.api.user.entity.User;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class UpdateUserStatusRequest {

    @NotNull(message = "Trạng thái không được để trống")
    private User.UserStatus status;
}