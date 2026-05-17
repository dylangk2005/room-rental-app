package com.roomrental.api.repository;

import com.roomrental.api.entity.UserPenalty;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;

public interface UserPenaltyRepository extends JpaRepository<UserPenalty, Integer> {
     Page<UserPenalty> findByUserId(Integer userId, Pageable pageable);

     List<UserPenalty> findByUserIdAndTypeInAndEndDateAfter(
             Integer userId,
             List<UserPenalty.PenaltyType> types,
             LocalDateTime now
     );

     void deleteByUserIdAndTypeIn(Integer userId, List<UserPenalty.PenaltyType> types);
}