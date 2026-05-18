package com.roomrental.api.repository;

import com.roomrental.api.entity.MembershipLevel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Repository
public interface MembershipLevelRepository extends JpaRepository<MembershipLevel, Integer> {

    Optional<MembershipLevel> findTopByMinSpentLessThanEqualOrderByMinSpentDesc(BigDecimal totalSpent); // Tìm cấp độ thành viên cao nhất mà tổng chi tiêu của khách hàng đã đạt được

    List<MembershipLevel> findAllByOrderByMinSpentAsc(); // Lấy tất cả cấp độ thành viên, sắp xếp theo minSpent tăng dần

    Optional<MembershipLevel> findFirstByMinSpentGreaterThanOrderByMinSpentAsc(BigDecimal totalSpent); // Tìm cấp độ thành viên tiếp theo mà tổng chi tiêu của khách hàng chưa đạt được
}