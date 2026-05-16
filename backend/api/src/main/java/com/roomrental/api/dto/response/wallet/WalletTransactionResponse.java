package com.roomrental.api.dto.response.wallet;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
public class WalletTransactionResponse {

    private Integer id;

    private String transactionType;

    private String status;

    private BigDecimal amount;

    private BigDecimal openingBalance;

    private BigDecimal closingBalance;

    private String description;

    private LocalDateTime createdAt;
}
