package com.roomrental.api.dto.request.payment;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class BoostPaymentRequest {

    @NotNull(message = "Mã tin đăng không được để trống")
    private Integer postId;
}
