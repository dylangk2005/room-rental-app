package com.roomrental.api.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.io.Serializable;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "favorites")
public class Favorite {

    @EmbeddedId
    private FavoriteId id;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("userId")
    @JoinColumn(name = "user_id")
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("postId")
    @JoinColumn(name = "post_id")
    private Post post;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    // Class đại diện cho Composite Primary Key (user_id + post_id)
    @Data
    @Embeddable
    public static class FavoriteId implements Serializable {
        @Column(name = "user_id")
        private Integer userId;

        @Column(name = "post_id")
        private Integer postId;
    }
}