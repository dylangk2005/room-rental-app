package com.roomrental.api.dto.request.admin;

import com.roomrental.api.entity.User;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class UpdateUserStatusRequest {

    @NotNull(message = "Trạng thái không được để trống")
    private User.UserStatus status;
}