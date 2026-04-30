package com.roomrental.api.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "post_extensions")
public class PostExtension {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "extended_days")
    private Integer extendedDays;

    @Column(name = "old_end_at")
    private LocalDateTime oldEndAt;

    @Column(name = "new_end_at")
    private LocalDateTime newEndAt;

    @Column(name = "final_fee", precision = 12, scale = 2, columnDefinition = "DECIMAL(12,2)")
    private BigDecimal finalFee;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "post_id")
    private Post post;
}