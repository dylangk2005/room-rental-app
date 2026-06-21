package com.roomrental.api.payment.dto.response;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class WalletTransactionResponse {

    private Integer id;

    private String transactionType;

    private String status;

    // Deposit fields
    private BigDecimal amount;
    private BigDecimal tax;
    private BigDecimal netAmount;
    private String method;
    private String transactionRef;
    private String gatewayTransactionNo;

    // Payment fields
    private BigDecimal baseFee;
    private BigDecimal finalFee;
    private Integer discountPercent;
    private Integer days;
    private LocalDate dayEnd;

    // Common
    private BigDecimal openingBalance;
    private BigDecimal closingBalance;
    private String description;
    private Integer postId;
    private String postTitle;
    private String postStatus;
    private LocalDateTime createdAt;
}
