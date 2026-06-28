package com.roomrental.api.pricing.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import lombok.Data;

@Data
@Entity
@Table(name = "post_type_prices")
public class PostTypePrice {

    @EmbeddedId
    private PostTypePriceId id;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("postTypeId")
    @JoinColumn(name = "post_type_id")
    private PostType postType;

    @Column(name = "price", precision = 12, scale = 2, columnDefinition = "DECIMAL(12,2)")
    private BigDecimal price;
}