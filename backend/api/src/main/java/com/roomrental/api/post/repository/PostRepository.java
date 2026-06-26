package com.roomrental.api.post.repository;

import com.roomrental.api.post.entity.Post.PostStatus;
import com.roomrental.api.post.entity.Post;
import com.roomrental.api.pricing.entity.PostType;
import com.roomrental.api.user.entity.User;
import jakarta.persistence.LockModeType;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface PostRepository extends JpaRepository<Post, Integer> {
    //Tìm kiếm bài đăng theo trạng thái, có phân trang
    @EntityGraph(attributePaths = {"postType", "user"})
    Page<Post> findByStatus(PostStatus status, Pageable pageable);

    // Lấy danh sách bài đăng public còn hiệu lực
    @EntityGraph(attributePaths = {"postType", "user"})
    @Query(
            value = """
        SELECT p FROM Post p
        WHERE p.status = :status
          AND p.endAt IS NOT NULL
          AND p.endAt > :now
    """,
            countQuery = """
        SELECT COUNT(p) FROM Post p
        WHERE p.status = :status
          AND p.endAt IS NOT NULL
          AND p.endAt > :now
    """
    )
    Page<Post> findPublicActivePosts(
            @Param("status") PostStatus status,
            @Param("now") LocalDateTime now,
            Pageable pageable
    );

    // Tìm kiếm bài đăng của người dùng, có phân trang
    @EntityGraph(attributePaths = {"postType", "user"})
    Page<Post> findByUserId(Integer userId, Pageable pageable);

    // Lấy thông tin chi tiết của phòng trọ, chưa bao gồm thông tin liên hệ
    @Query("""
    SELECT p FROM Post p
    JOIN FETCH p.user
    LEFT JOIN FETCH p.postType
    WHERE p.id = :id
""")
    Optional<Post> findDetailById(@Param("id") Integer id);

    // Tim kiem bai dang theo tieu chi, loc theo FK provinceId/districtId
    @Query(
            value = """
        SELECT p FROM Post p
        JOIN FETCH p.postType
        JOIN FETCH p.provinceRef
        JOIN FETCH p.districtRef
        WHERE p.status = :status
          AND p.endAt IS NOT NULL
          AND p.endAt > :now
          AND (:provinceId IS NULL OR p.provinceRef.id = :provinceId)
          AND (:districtId IS NULL OR p.districtRef.id = :districtId)
          AND (:minPrice IS NULL OR p.rentalPrice >= :minPrice)
          AND (:maxPrice IS NULL OR p.rentalPrice <= :maxPrice)
          AND (:minArea IS NULL OR p.area >= :minArea)
          AND (:maxArea IS NULL OR p.area <= :maxArea)
    """,
            countQuery = """
        SELECT COUNT(p) FROM Post p
        WHERE p.status = :status
          AND p.endAt IS NOT NULL
          AND p.endAt > :now
          AND (:provinceId IS NULL OR p.provinceRef.id = :provinceId)
          AND (:districtId IS NULL OR p.districtRef.id = :districtId)
          AND (:minPrice IS NULL OR p.rentalPrice >= :minPrice)
          AND (:maxPrice IS NULL OR p.rentalPrice <= :maxPrice)
          AND (:minArea IS NULL OR p.area >= :minArea)
          AND (:maxArea IS NULL OR p.area <= :maxArea)
    """
    )
    Page<Post> searchPosts(
            @Param("status") PostStatus status,
            @Param("now") LocalDateTime now,
            @Param("provinceId") Integer provinceId,
            @Param("districtId") Integer districtId,
            @Param("minPrice") BigDecimal minPrice,
            @Param("maxPrice") BigDecimal maxPrice,
            @Param("minArea") BigDecimal minArea,
            @Param("maxArea") BigDecimal maxArea,
            Pageable pageable
    );

    interface PostLocationView {
        String getProvince();
        String getDistrict();
    }

    @Query("""
    SELECT DISTINCT pr.name AS province, d.name AS district
    FROM Post p
    JOIN p.provinceRef pr
    JOIN p.districtRef d
    WHERE p.status = :status
      AND p.endAt IS NOT NULL
      AND p.endAt > :now
    ORDER BY pr.name ASC, d.name ASC
""")
    List<PostLocationView> findActiveLocations(
            @Param("status") PostStatus status,
            @Param("now") LocalDateTime now
    );

    // Tìm bài đăng của ngời dùng để thanh toán, cần khóa bản ghi để tránh xung đột
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
    SELECT p FROM Post p
    JOIN FETCH p.user
    JOIN FETCH p.postType
    WHERE p.id = :id
""")
    Optional<Post> findByIdForPayment(@Param("id") Integer id);

    // Tìm bài đăng để duyệt, cần khóa bản ghi để tránh xung đột
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
    SELECT p FROM Post p
    JOIN FETCH p.user
    LEFT JOIN FETCH p.postType
    WHERE p.id = :id
""")
    Optional<Post> findByIdForModeration(@Param("id") Integer id);

    // Lấy danh sách bài đăng để duyệt, có phân trang
    @Query("""
    SELECT p FROM Post p
    JOIN FETCH p.user
    LEFT JOIN FETCH p.postType
    WHERE (:status IS NULL OR p.status = :status)
      AND (:postTypeId IS NULL OR p.postType.id = :postTypeId)
      AND (:keyword IS NULL OR p.id = :keyword)
    AND (:keyword IS NULL OR p.id = :keyword)
""")
    Page<Post> findModerationQueue(
            @Param("status") Post.PostStatus status,
            @Param("postTypeId") Integer postTypeId,
            @Param("keyword") Integer keyword,
            Pageable pageable
    );

    // Giao diện dự án để lấy thông tin thống kê số lượng bài đăng theo loại trong khoảng thời gian
    interface PostTypeStatsView {
        String getPostTypeName();
        Long getTotalPosts();
    }

    // Thống kê số lượng bài đăng được tạo ra trong khoảng thời gian
    long countByCreatedAtBetween(LocalDateTime from, LocalDateTime to);

    // Thống kê số lượng bài đăng theo trạng thái
    long countByStatus(Post.PostStatus status);

    // Chuyển các bài đăng đang hoạt động nhưng đã qua thời hạn sang hết hạn
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("""
    UPDATE Post p
    SET p.status = :expiredStatus,
        p.updatedAt = :now
    WHERE p.status = :activeStatus
      AND p.endAt IS NOT NULL
      AND p.endAt <= :now
""")
    int expireActivePosts(
            @Param("activeStatus") Post.PostStatus activeStatus,
            @Param("expiredStatus") Post.PostStatus expiredStatus,
            @Param("now") LocalDateTime now
    );

    // Thống kê số lượng bài đăng theo loại trong khoảng thời gian
    @Query("""
    SELECT p.postType.name AS postTypeName, COUNT(p) AS totalPosts
    FROM Post p
    WHERE p.createdAt BETWEEN :from AND :to
    GROUP BY p.postType.name
""")
    List<PostTypeStatsView> countPostsByType(
            @Param("from") LocalDateTime from,
            @Param("to") LocalDateTime to
    );
}
