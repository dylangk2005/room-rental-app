package com.roomrental.api.notification.repository;

import com.roomrental.api.notification.entity.Notification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Integer> {

    Page<Notification> findByUser_Id(Integer userId, Pageable pageable);

    int countByUser_IdAndIsRead(Integer userId, boolean isRead);
}