package com.roomrental.api.dto.response.wallet;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

@Data
@Builder
public class DepositInitResponse {

    private Integer depositId;

    private BigDecimal amount;

    private String transactionRef;

    private String paymentUrl;
}
