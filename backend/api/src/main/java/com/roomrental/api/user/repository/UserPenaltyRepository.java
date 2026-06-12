package com.roomrental.api.user.repository;

import com.roomrental.api.user.entity.User;
import com.roomrental.api.user.entity.UserPenalty;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface UserPenaltyRepository extends JpaRepository<UserPenalty, Integer> {
     Page<UserPenalty> findByUserId(Integer userId, Pageable pageable);

     List<UserPenalty> findByUserIdAndTypeInAndEndDateAfter(
             Integer userId,
             List<UserPenalty.PenaltyType> types,
             LocalDateTime now
     );

     @Query("""
          SELECT p FROM UserPenalty p
          WHERE p.user.id = :userId
            AND (p.endDate IS NULL OR p.endDate > :now)
          ORDER BY p.createdAt DESC
     """)
     List<UserPenalty> findActiveByUserId(
             @Param("userId") Integer userId,
             @Param("now") LocalDateTime now
     );

     void deleteByUserIdAndTypeIn(Integer userId, List<UserPenalty.PenaltyType> types);

     List<UserPenalty> findByTypeAndEndDateBefore(UserPenalty.PenaltyType type, LocalDateTime now);

     @Query("""
          SELECT COUNT(p) FROM UserPenalty p
          WHERE p.user.id = :userId
            AND p.type = :type
            AND (p.endDate IS NULL OR p.endDate > :now)
     """)
     long countActivePenalties(
             @Param("userId") Integer userId,
             @Param("type") UserPenalty.PenaltyType type,
             @Param("now") LocalDateTime now
     );
}