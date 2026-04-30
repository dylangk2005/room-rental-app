package com.roomrental.api.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

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

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}