package com.roomrental.api.repository;

import com.roomrental.api.entity.MembershipLevel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Repository
public interface MembershipLevelRepository extends JpaRepository<MembershipLevel, Integer> {

    Optional<MembershipLevel> findTopByMinSpentLessThanEqualOrderByMinSpentDesc(BigDecimal totalSpent);

    List<MembershipLevel> findAllByOrderByMinSpentAsc();

    Optional<MembershipLevel> findFirstByOrderByMinSpentAsc();

    Optional<MembershipLevel> findFirstByMinSpentGreaterThanOrderByMinSpentAsc(BigDecimal totalSpent);
}
