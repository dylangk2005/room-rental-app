package com.roomrental.api.repository;

import com.roomrental.api.entity.Deposit;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface DepositRepository extends JpaRepository <Deposit, Integer>{
    Page<Deposit> findByUserId(Integer userId, Pageable pageable);
}
