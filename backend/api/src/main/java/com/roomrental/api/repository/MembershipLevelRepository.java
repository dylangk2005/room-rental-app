package com.roomrental.api.repository;

import com.roomrental.api.entity.MembershipLevel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.Optional;

@Repository
public interface MembershipLevelRepository extends JpaRepository<MembershipLevel, Integer> {

    // Tìm hạng phù hợp với tổng chi tiêu
    // SELECT * WHERE min_spent <= totalSpent ORDER BY min_spent DESC LIMIT 1
    Optional<MembershipLevel> findTopByMinSpentLessThanEqualOrderByMinSpentDesc(BigDecimal totalSpent);
}

