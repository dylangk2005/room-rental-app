package com.roomrental.api.payment.dto.response;

import com.roomrental.api.payment.entity.Payment;
import com.roomrental.api.post.entity.Post.PostStatus;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import lombok.Builder;
import lombok.Data;

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

    private Integer postId;

    private String postTitle;

    private String postStatus;

    private LocalDateTime createdAt;
}