package com.roomrental.api.pricing.repository;

import com.roomrental.api.pricing.entity.MembershipLevel;
import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface MembershipLevelRepository extends JpaRepository<MembershipLevel, Integer> {

    Optional<MembershipLevel> findTopByMinSpentLessThanEqualOrderByMinSpentDesc(BigDecimal totalSpent);

    List<MembershipLevel> findAllByOrderByMinSpentAsc();

    Optional<MembershipLevel> findFirstByOrderByMinSpentAsc();

    Optional<MembershipLevel> findFirstByMinSpentGreaterThanOrderByMinSpentAsc(BigDecimal totalSpent);
}