package com.roomrental.api.payment.dto;

import com.roomrental.api.payment.entity.Payment;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class BoostPaymentRequest {

    @NotNull(message = "Mã tin đăng không được để trống")
    private Integer postId;
}