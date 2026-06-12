package com.roomrental.api.user.repository;

import com.roomrental.api.pricing.entity.MembershipLevel;
import com.roomrental.api.user.entity.Role;
import com.roomrental.api.user.entity.User;
import jakarta.persistence.LockModeType;
import java.time.LocalDateTime;
import java.util.List;
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
public interface UserRepository extends JpaRepository <User, Integer>{
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);
    boolean existsByEmailAndIdNot(String email, Integer id);
    boolean existsByPhoneNumber(String phoneNumber);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @EntityGraph(attributePaths = "membershipLevel")
    @Query("SELECT u FROM User u WHERE u.id = :id")
    Optional<User> findByIdForPayment(@Param("id") Integer id);

    List<User> findByRole_Name(String roleName);

    long countByCreatedAtBetween(LocalDateTime from, LocalDateTime to);

    long countByStatus(User.UserStatus status);

    boolean existsByPhoneNumberAndIdNot(String phoneNumber, Integer id); // Kiểm tra số điện thoại đã tồn tại cho người dùng khác (trừ chính nó)

    @Query("""
    SELECT u FROM User u
    JOIN FETCH u.role r
    WHERE r.name IN :roleNames
      AND (:roleName IS NULL OR r.name = :roleName)
      AND (:status IS NULL OR u.status = :status)
""")
    Page<User> findInternalUsers(
            @Param("roleNames") List<String> roleNames,
            @Param("roleName") String roleName,
            @Param("status") User.UserStatus status,
            Pageable pageable
    );

    @Query("""
    SELECT u FROM User u
    LEFT JOIN FETCH u.role r
    WHERE (:roleName IS NULL OR r.name = :roleName)
      AND (:status IS NULL OR u.status = :status)
      AND (
            :keyword IS NULL
            OR LOWER(u.fullName) LIKE LOWER(CONCAT('%', :keyword, '%'))
            OR LOWER(u.email) LIKE LOWER(CONCAT('%', :keyword, '%'))
            OR u.phoneNumber LIKE CONCAT('%', :keyword, '%')
      )
""")
    Page<User> searchAdminUsers(
            @Param("roleName") String roleName,
            @Param("status") User.UserStatus status,
            @Param("keyword") String keyword,
            Pageable pageable
    );
}