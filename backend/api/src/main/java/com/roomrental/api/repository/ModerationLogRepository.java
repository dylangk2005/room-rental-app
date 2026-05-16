package com.roomrental.api.repository;

import com.roomrental.api.entity.ModerationLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ModerationLogRepository extends JpaRepository<ModerationLog, Integer> {

    @EntityGraph(attributePaths = "user")
    Page<ModerationLog> findAll(Pageable pageable); // Lấy tất cả log với thông tin người dùng, phân trang

    @EntityGraph(attributePaths = "user")
    Page<ModerationLog> findByUser_Id(Integer userId, Pageable pageable); // Lấy log theo ID người dùng, phân trang

    @EntityGraph(attributePaths = "user")
    Page<ModerationLog> findByAction(ModerationLog.ModerationAction action, Pageable pageable); // Lấy log theo hành động, phân trang

    @EntityGraph(attributePaths = "user")
    Page<ModerationLog> findByTargetTypeAndTargetId( // Lấy log theo loại đối tượng và ID đối tượng, phân trang
            ModerationLog.TargetType targetType,
            Integer targetId,
            Pageable pageable
    );
}