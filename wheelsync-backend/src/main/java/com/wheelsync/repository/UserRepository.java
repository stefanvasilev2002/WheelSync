package com.wheelsync.repository;

import com.wheelsync.entity.User;
import com.wheelsync.entity.enums.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);
    Optional<User> findByResetToken(String resetToken);
    List<User> findByCompanyId(Long companyId);
    List<User> findByCompanyIdAndRole(Long companyId, Role role);
    List<User> findByCompanyIdAndIsActiveTrue(Long companyId);
}
