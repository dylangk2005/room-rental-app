package com.roomrental.api.repository;

import com.roomrental.api.entity.UserPenalty;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface UserPenaltyRepository extends JpaRepository <UserPenalty, Integer> {
     Page findByUserId(Integer userId, Pageable pageable);
     void deleteByUserIdAndType(Integer userId, UserPenalty.PenaltyType type);
}
