package com.roomrental.api.repository;

import com.roomrental.api.entity.Transaction;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TransactionRepository extends JpaRepository <Transaction, Integer>{
    Page<Transaction> findByUserId(Integer userId, Pageable pageable);
    Page<Transaction> findByPostId(Integer postId, Pageable pageable);
}
