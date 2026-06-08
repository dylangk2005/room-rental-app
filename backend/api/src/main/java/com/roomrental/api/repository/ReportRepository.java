package com.roomrental.api.repository;

import com.roomrental.api.entity.Report;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

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

    boolean existsByUserIdAndPostId(Integer userId, Integer postId);
}
