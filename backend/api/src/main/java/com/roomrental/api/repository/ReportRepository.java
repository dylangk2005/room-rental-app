package com.roomrental.api.repository;

import com.roomrental.api.entity.Report;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ReportRepository extends JpaRepository<Report, Integer> {

    @EntityGraph(attributePaths = {"user", "post", "post.user", "moderator"})
    Page<Report> findAll(Pageable pageable);

    @EntityGraph(attributePaths = {"user", "post", "post.user", "moderator"})
    Page<Report> findByUserId(Integer userId, Pageable pageable);

    @EntityGraph(attributePaths = {"user", "post", "post.user", "moderator"})
    Page<Report> findByStatus(Report.ReportStatus status, Pageable pageable);

    boolean existsByUserIdAndPostId(Integer userId, Integer postId);
}