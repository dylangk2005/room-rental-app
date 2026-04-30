package com.roomrental.api.entity;
import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "full_name", length = 255)
    private String fullName;

    @Column(name = "email", length = 255, unique = true)
    private String email;

    @Column(name = "password", length = 255)
    private String password;

    @Column(name = "phone_number", length = 20, unique = true)
    private String phoneNumber;

    @Column(name = "avatar", columnDefinition = "TEXT")
    private String avatar;

    @Enumerated(EnumType.STRING)
    @Column(name = "status")
    private UserStatus status = UserStatus.INACTIVE;

    @Column(name = "account_balance", precision = 12, scale = 2, columnDefinition = "DECIMAL(12,2)")
    private BigDecimal accountBalance = BigDecimal.ZERO;

    @Column(name = "total_spent", precision = 12, scale = 2, columnDefinition = "DECIMAL(12,2)")
    private BigDecimal totalSpent = BigDecimal.ZERO;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "role_id")
    private Role role;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "membership_level_id")
    private MembershipLevel membershipLevel;

    public enum UserStatus {
        ACTIVE, INACTIVE, BANNED
    }
}