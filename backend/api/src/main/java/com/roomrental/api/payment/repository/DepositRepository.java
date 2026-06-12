package com.roomrental.api.payment.repository;

import com.roomrental.api.payment.entity.Deposit;
import com.roomrental.api.payment.entity.Payment;
import com.roomrental.api.user.entity.User;
import jakarta.persistence.LockModeType;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface DepositRepository extends JpaRepository <Deposit, Integer>{
    @Query("SELECT d FROM Deposit d WHERE d.user.id = :userId")
    Page<Deposit> findByUserId(@Param("userId") Integer userId, Pageable pageable);

    Optional<Deposit> findByTransactionRef(String transactionRef);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @EntityGraph(attributePaths = "user")
    @Query("SELECT d FROM Deposit d WHERE d.transactionRef = :transactionRef")
    Optional<Deposit> findByTransactionRefForUpdate(@Param("transactionRef") String transactionRef);

}