package com.roomrental.api.pricing.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import lombok.Data;

@Data
@Entity
@Table(name = "post_types")
public class PostType {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "name", length = 100)
    private String name;

    @Column(name = "title_color", length = 20)
    private String titleColor;

    @Column(name = "title_size")
    private Integer titleSize;

    @Column(name = "priority")
    private Integer priority;

    @Column(name = "push_price", precision = 12, scale = 2, columnDefinition = "DECIMAL(12,2)")
    private BigDecimal pushPrice;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}