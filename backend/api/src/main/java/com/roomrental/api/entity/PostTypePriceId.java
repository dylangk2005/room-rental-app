package com.roomrental.api.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

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
