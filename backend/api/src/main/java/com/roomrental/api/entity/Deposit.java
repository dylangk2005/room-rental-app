package com.roomrental.api.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "deposits")
public class Deposit {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "amount", precision = 12, scale = 2, columnDefinition = "DECIMAL(12,2)")
    private BigDecimal amount;

    @Column(name = "tax", precision = 12, scale = 2, columnDefinition = "DECIMAL(12,2)")
    private BigDecimal tax;

    @Column(name = "net_amount", precision = 12, scale = 2, columnDefinition = "DECIMAL(12,2)")
    private BigDecimal netAmount;

    @Enumerated(EnumType.STRING)
    @Column(name = "method")
    private DepositMethod method;

    @Enumerated(EnumType.STRING)
    @Column(name = "status")
    private DepositStatus status = DepositStatus.PENDING;

    @Column(name = "transaction_ref", length = 100, unique = true)
    private String transactionRef;

    @Column(name = "gateway_transaction_no", length = 100)
    private String gatewayTransactionNo;

    @Column(name = "opening_balance", precision = 12, scale = 2, columnDefinition = "DECIMAL(12,2)")
    private BigDecimal openingBalance;

    @Column(name = "closing_balance", precision = 12, scale = 2, columnDefinition = "DECIMAL(12,2)")
    private BigDecimal closingBalance;

    @Column(name = "note", columnDefinition = "TEXT")
    private String note;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    public enum DepositMethod {
        BANK_TRANSFER, VNPAY
    }

    public enum DepositStatus {
        PENDING, SUCCESS, FAILED, CANCELLED
    }
}
