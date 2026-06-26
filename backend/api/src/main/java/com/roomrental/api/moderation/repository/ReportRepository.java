package com.roomrental.api.moderation.repository;

import com.roomrental.api.moderation.entity.Report;
import com.roomrental.api.post.entity.Post;
import com.roomrental.api.pricing.entity.PostType;
import com.roomrental.api.user.entity.User;
import java.util.Optional;
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

    @EntityGraph(attributePaths = {"user", "post", "post.user", "post.postType", "moderator"})
    Optional<Report> findDetailById(Integer id);

    @EntityGraph(attributePaths = {"user", "post", "post.user", "moderator"})
    Page<Report> findByStatusNot(Report.ReportStatus status, Pageable pageable);

    boolean existsByUserIdAndPostId(Integer userId, Integer postId);
}