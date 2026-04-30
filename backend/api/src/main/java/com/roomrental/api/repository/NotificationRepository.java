package com.roomrental.api.repository;

import com.roomrental.api.entity.Notification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface NotificationRepository extends JpaRepository <Notification, Integer> {
    Page<Notification> findByUserId(Integer userId, Pageable pageable);
    int countByUserIdAndIsRead(Integer userId, boolean isRead);
}
