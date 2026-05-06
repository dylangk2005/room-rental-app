package com.roomrental.api.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

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
        ACCEPT_POST, REJECT_POST, HIDDEN_POST, REMOVE_POST,
        ACCEPT_REPORT, REJECT_REPORT, LOCK_POST, BAN_ACCOUNT
    }

    public enum TargetType {
        POST, REPORT, USER
    }
}