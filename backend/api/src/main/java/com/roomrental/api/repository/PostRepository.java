package com.roomrental.api.repository;

import com.roomrental.api.entity.Post;
import com.roomrental.api.entity.Post.PostStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;


import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface PostRepository extends JpaRepository <Post, Integer>{
    Page<Post> findByStatus(PostStatus status, Pageable pageable); // tim kiếm bài đăng theo trạng thái với phân trang
    Page<Post> findByUserIdAndStatus(Integer userId, PostStatus status, Pageable pageable); // tìm kiếm bài đăng của người dùng theo trạng thái với phân trang
    List<Post> findByStatusAndEndAtBefore(PostStatus status, LocalDateTime now); // tìm kiếm bài đăng đã hết hạn (endAt trước thời điểm hiện tại)

    // Tìm kiếm theo tiêu chí
    @Query(
            """
            SELECT p FROM Post p
            WHERE p.status = 'ACTIVE'
            AND (:province IS NULL OR p.province = :province)
            AND (:district IS NULL OR p.district = :district)
            AND (:minPrice IS NULL OR p.rentalPrice >= :minPrice)
            AND (:maxPrice IS NULL OR p.rentalPrice <= :maxPrice)
            AND (:minArea IS NULL OR p.area >= :minArea)
            AND (:maxArea IS NULL OR p.area <= :maxArea)
            """
    )
    Page<Post> searchPosts(
            @Param("province") String province,
            @Param("district") String district,
            @Param("minPrice") BigDecimal minPrice,
            @Param("maxPrice") BigDecimal maxPrice,
            @Param("minArea") BigDecimal minArea,
            @Param("maxArea") BigDecimal maxArea,
            Pageable pageable
    );

    // Tất cả tin của 1 user (mọi trạng thái)
    Page<Post> findByUserId(Integer userId, Pageable pageable);
}
