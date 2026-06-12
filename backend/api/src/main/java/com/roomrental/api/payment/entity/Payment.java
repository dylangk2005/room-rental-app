package com.roomrental.api.payment.entity;

import com.roomrental.api.post.entity.Post;
import com.roomrental.api.user.entity.User;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import lombok.Data;

@Data
@Entity
@Table(name = "payments")
public class Payment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_type")
    private PaymentType paymentType;

    @Column(name = "days")
    private Integer days;

    @Column(name = "day_end")
    private LocalDate dayEnd;

    @Column(name = "base_fee", precision = 12, scale = 2, columnDefinition = "DECIMAL(12,2)")
    private BigDecimal baseFee;

    @Column(name = "tax", precision = 12, scale = 2, columnDefinition = "DECIMAL(12,2)")
    private BigDecimal tax;

    @Column(name = "discount_percent")
    private Integer discountPercent;

    @Column(name = "final_fee", precision = 12, scale = 2, columnDefinition = "DECIMAL(12,2)")
    private BigDecimal finalFee;

    @Column(name = "opening_balance", precision = 12, scale = 2)
    private BigDecimal openingBalance;

    @Column(name = "closing_balance", precision = 12, scale = 2)
    private BigDecimal closingBalance;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "post_id")
    private Post post;

    public enum PaymentType {
        POST_PAYMENT, EXTEND, REFUND, PUSH
    }
}