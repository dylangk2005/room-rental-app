package com.roomrental.api.admin.entity;

import com.roomrental.api.moderation.entity.Report;
import com.roomrental.api.payment.entity.Deposit;
import com.roomrental.api.post.entity.Post;
import com.roomrental.api.user.entity.User;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import lombok.Data;

@Data
@Entity
@Table(name = "audit_logs")
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "action", length = 100)
    private String action;

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

    public enum TargetType {
        SYSTEM, USER, POST, TRANSACTION, REPORT, DEPOSIT, MEMBERSHIP
    }
}