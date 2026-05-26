package com.wheelsync.repository;

import com.wheelsync.entity.PushSubscription;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface PushSubscriptionRepository extends JpaRepository<PushSubscription, Long> {

    List<PushSubscription> findByUserId(Long userId);

    Optional<PushSubscription> findByUserIdAndEndpoint(Long userId, String endpoint);

    void deleteByUserIdAndEndpoint(Long userId, String endpoint);

    /** All subscriptions for a given company's users (used by the scheduler). */
    @Query("""
        SELECT ps FROM PushSubscription ps
        JOIN ps.user u
        WHERE u.company.id = :companyId
          AND u.isActive = true
          AND u.role = 'FLEET_MANAGER'
        """)
    List<PushSubscription> findByCompanyManagers(@Param("companyId") Long companyId);

    /** Subscription for a specific user (used for defect reporter notifications). */
    List<PushSubscription> findAllByUserId(Long userId);
}
