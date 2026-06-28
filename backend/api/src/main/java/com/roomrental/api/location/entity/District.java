package com.roomrental.api.location.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import lombok.Data;

@Data
@Entity
@Table(name = "districts")
public class District {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "province_id", nullable = false)
    private Integer provinceId;

    @Column(name = "name", length = 100, nullable = false)
    private String name;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
