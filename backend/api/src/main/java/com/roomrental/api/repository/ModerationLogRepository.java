package com.roomrental.api.repository;

import com.roomrental.api.entity.ModerationLog;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ModerationLogRepository extends JpaRepository <ModerationLog, Integer> {
}
