package com.roomrental.api.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "posts")
public class Post {

    // Id của bài đăng, tự tăng
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    // Tiêu đề bài đăng, tối đa 255 ký tự
    @Column(name = "title", length = 255)
    private String title;

    // Mô tả chi tiết bài đăng, có thể dài, sử dụng TEXT
    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    // Địa chỉ phòng trọ, có thể dài, sử dụng TEXT
    @Column(name = "address", columnDefinition = "TEXT")
    private String address;

    // Tỉnh/Thành phố, tối đa 100 ký tự
    @Column(name = "province", length = 100)
    private String province;

    // Quận/Huyện, tối đa 100 ký tự
    @Column(name = "district", length = 100)
    private String district;

    // Diện tích phòng trọ, sử dụng DECIMAL(6,2) để lưu trữ diện tích với tối đa 9999.99 m2
    @Column(name = "area", precision = 6, scale = 2, columnDefinition = "DECIMAL(6,2)")
    private BigDecimal area;

    // Giá thuê phòng trọ, sử dụng DECIMAL(12,2) để lưu trữ giá với tối đa 9999999999.99
    @Column(name = "rental_price", precision = 12, scale = 2, columnDefinition = "DECIMAL(12,2)")
    private BigDecimal rentalPrice;

    // Trạng thái bài đăng, sử dụng Enum PostStatus, lưu trữ dưới dạng chuỗi
    @Enumerated(EnumType.STRING)
    @Column(name = "status")
    private PostStatus status = PostStatus.PENDING;

    // Ngày tạo bài đăng
    @Column(name = "created_at")
    private LocalDateTime createdAt;

    // Ngày cập nhật bài đăng
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // Thời gian bài đăng được đẩy lên
    @Column(name = "push_time")
    private LocalDateTime pushTime;

    // Ngày hết hạn bài đăng, được tính từ push_time + duration_days
    @Column(name = "end_at")
    private LocalDateTime endAt;

    // Id người dùng đăng bài, liên kết tới bảng users
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    // Id loại bài đăng, liên kết tới bảng post_types
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "post_type_id")
    private PostType postType;

    // Số ngày bài đăng được đăng lên, dùng để tính end_at = push_time + duration_days
    @Column(name = "duration_days")
    private Integer durationDays;

    // Trạng thái của bài đăng
    public enum PostStatus {
        DRAFT, PENDING, ACTIVE, EXPIRED, REJECTED, HIDDEN, DELETED
    }
}