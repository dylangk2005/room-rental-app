package com.roomrental.api.pricing.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import java.io.Serializable;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Embeddable
@NoArgsConstructor
@AllArgsConstructor
public class PostTypePriceId implements Serializable {

    @Column(name = "post_type_id")
    private Integer postTypeId;

    @Column(name = "day")
    private Integer day;
}