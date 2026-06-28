package com.roomrental.api.payment.repository;

import com.roomrental.api.payment.entity.Payment;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Integer> {
    @EntityGraph(attributePaths = "post")
    @Query("SELECT p FROM Payment p WHERE p.user.id = :userId")
    Page<Payment> findByUserId(@Param("userId") Integer userId, Pageable pageable);

    Optional<Payment> findTopByPostIdAndPaymentTypeOrderByCreatedAtDesc(
            Integer postId,
            Payment.PaymentType paymentType
    );

    @Query("""
    SELECT COALESCE(SUM(p.finalFee), 0)
    FROM Payment p
    WHERE p.paymentType IN :types
      AND p.createdAt BETWEEN :from AND :to
""")
    BigDecimal sumFinalFeeByTypesAndCreatedAtBetween(
            @Param("types") List<Payment.PaymentType> types,
            @Param("from") LocalDateTime from,
            @Param("to") LocalDateTime to
    );

    @Query("""
    SELECT p FROM Payment p
    JOIN FETCH p.user
    LEFT JOIN FETCH p.post
    WHERE (:paymentType IS NULL OR p.paymentType = :paymentType)
      AND (:from IS NULL OR p.createdAt >= :from)
      AND (:to IS NULL OR p.createdAt <= :to)
    ORDER BY p.createdAt DESC
""")
    List<Payment> findForExport(
            @Param("paymentType") Payment.PaymentType paymentType,
            @Param("from") LocalDateTime from,
            @Param("to") LocalDateTime to
    );

}