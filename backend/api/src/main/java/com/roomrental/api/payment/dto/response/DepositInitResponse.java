package com.roomrental.api.payment.dto.response;

import com.roomrental.api.payment.entity.Payment;
import java.math.BigDecimal;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class DepositInitResponse {

    private Integer depositId;

    private BigDecimal amount;

    private String transactionRef;

    private String paymentUrl;
}