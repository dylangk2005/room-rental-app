package com.roomrental.api.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "transactions")
public class Transaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Enumerated(EnumType.STRING)
    @Column(name = "transaction_type")
    private TransactionType transactionType;

    @Column(name = "base_fee", precision = 12, scale = 2, columnDefinition = "DECIMAL(12,2)")
    private BigDecimal baseFee;

    @Column(name = "discount_percent")
    private Integer discountPercent;

    @Column(name = "final_fee", precision = 12, scale = 2, columnDefinition = "DECIMAL(12,2)")
    private BigDecimal finalFee;

    @Column(name = "tax", precision = 12, scale = 2, columnDefinition = "DECIMAL(12,2)")
    private BigDecimal tax;

    @Column(name = "opening_balance", precision = 12, scale = 2, columnDefinition = "DECIMAL(12,2)")
    private BigDecimal openingBalance;

    @Column(name = "closing_balance", precision = 12, scale = 2, columnDefinition = "DECIMAL(12,2)")
    private BigDecimal closingBalance;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ref_transaction_id")
    private Transaction refTransaction;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "post_id")
    private Post post;

    public enum TransactionType {
        POST_PAYMENT, EXTEND, REFUND
    }
}