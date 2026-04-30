package com.roomrental.api.repository;

import com.roomrental.api.entity.Report;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;


@Repository
public interface ReportRepository extends JpaRepository<Report, Integer> {
    Page<Report> findByUserId(Integer userId, Pageable pageable);
    boolean existsByUserIdAndPostId(Integer userId, Integer postId);
}
