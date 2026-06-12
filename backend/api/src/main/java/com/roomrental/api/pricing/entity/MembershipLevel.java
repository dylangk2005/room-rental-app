package com.roomrental.api.pricing.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import lombok.Data;

@Data
@Entity
@Table(name = "membership_levels")
public class MembershipLevel {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Integer id;

    @Column(name = "name", length = 100)
    private String name;

    @Column(name = "min_spent", precision = 12, scale = 2, columnDefinition = "DECIMAL(12,2)")
    private BigDecimal minSpent;

    @Column(name = "discount_percent")
    private Integer discountPercent;

    @Column(name = "updated_at")
    private java.sql.Timestamp updatedAt;
}