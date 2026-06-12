package com.roomrental.api.payment.dto.request;

import com.roomrental.api.payment.entity.Payment;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class PayPostRequest {

    @NotNull(message = "Mã tin đăng không được để trống")
    private Integer postId;

    @NotNull(message = "Số ngày đăng không được để trống")
    @Min(value = 1, message = "Số ngày đăng tối thiểu 1 ngày")
    private Integer durationDays;
}