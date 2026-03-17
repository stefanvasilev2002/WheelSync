package com.wheelsync.repository;

import com.wheelsync.entity.MaintenanceReminder;
import com.wheelsync.entity.enums.ServiceType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface MaintenanceReminderRepository extends JpaRepository<MaintenanceReminder, Long> {
    List<MaintenanceReminder> findByVehicleIdAndIsActiveTrue(Long vehicleId);
    Optional<MaintenanceReminder> findByVehicleIdAndServiceTypeAndIsActiveTrue(Long vehicleId, ServiceType serviceType);

    @Query("SELECT r FROM MaintenanceReminder r WHERE r.vehicle.company.id = :companyId AND r.isActive = true " +
           "AND (r.nextDueDate <= :thresholdDate OR r.nextDueMileage <= :currentMileage + r.warningThresholdKm)")
    List<MaintenanceReminder> findUpcomingByCompany(@Param("companyId") Long companyId,
                                                    @Param("thresholdDate") LocalDate thresholdDate,
                                                    @Param("currentMileage") Integer currentMileage);

    @Query("SELECT r FROM MaintenanceReminder r WHERE r.isActive = true " +
           "AND r.nextDueDate IS NOT NULL AND r.nextDueDate <= :checkDate")
    List<MaintenanceReminder> findAllDueSoon(@Param("checkDate") LocalDate checkDate);
}
