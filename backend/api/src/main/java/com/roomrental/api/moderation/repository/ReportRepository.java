package com.roomrental.api.moderation.repository;

import com.roomrental.api.moderation.entity.Report;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface ReportRepository extends JpaRepository<Report, Integer> {

    @EntityGraph(attributePaths = {"user", "post", "post.user", "moderator"})
    Page<Report> findAll(Pageable pageable);

    @EntityGraph(attributePaths = {"user", "post", "post.user", "moderator"})
    Page<Report> findByUserId(Integer userId, Pageable pageable);

    @EntityGraph(attributePaths = {"user", "post", "post.user", "moderator"})
    Page<Report> findByStatus(Report.ReportStatus status, Pageable pageable);

    @EntityGraph(attributePaths = {"user", "post", "post.user", "post.postType", "moderator"})
    Optional<Report> findDetailById(Integer id);

    @EntityGraph(attributePaths = {"user", "post", "post.user", "moderator"})
    Page<Report> findByStatusNot(Report.ReportStatus status, Pageable pageable);

    boolean existsByUserIdAndPostId(Integer userId, Integer postId);

    @Query("""
    SELECT r FROM Report r
    LEFT JOIN FETCH r.user
    LEFT JOIN FETCH r.post p
    LEFT JOIN FETCH p.user
    LEFT JOIN FETCH r.moderator
    WHERE (:status IS NULL OR r.status = :status)
      AND (:from IS NULL OR r.createdAt >= :from)
      AND (:to IS NULL OR r.createdAt <= :to)
    ORDER BY r.createdAt DESC
""")
    List<Report> findForExport(
            @Param("status") Report.ReportStatus status,
            @Param("from") LocalDateTime from,
            @Param("to") LocalDateTime to
    );
}