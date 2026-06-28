package com.roomrental.api.moderation.entity;

import com.roomrental.api.post.entity.Post;
import com.roomrental.api.user.entity.User;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import lombok.Data;

@Data
@Entity
@Table(name = "moderation_logs")
public class ModerationLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Enumerated(EnumType.STRING)
    @Column(name = "action")
    private ModerationAction action;

    @Enumerated(EnumType.STRING)
    @Column(name = "target_type")
    private TargetType targetType;

    @Column(name = "target_id")
    private Integer targetId;

    @Column(name = "reason", columnDefinition = "TEXT")
    private String reason;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    public enum ModerationAction {
        ACCEPT_POST, REJECT_POST, HIDDEN_POST, UNHIDDEN_POST, REMOVE_POST,
        ACCEPT_REPORT, REJECT_REPORT, WARNING, LOCK_POST, BAN_ACCOUNT
    }

    public enum TargetType {
        POST, REPORT, USER
    }
}