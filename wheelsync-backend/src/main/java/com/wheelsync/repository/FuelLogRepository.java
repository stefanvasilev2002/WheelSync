package com.wheelsync.repository;

import com.wheelsync.entity.FuelLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FuelLogRepository extends JpaRepository<FuelLog, Long> {
    List<FuelLog> findByVehicleIdOrderByDateDesc(Long vehicleId);
    List<FuelLog> findByDriverIdOrderByDateDesc(Long driverId);

    @Query("SELECT f FROM FuelLog f WHERE f.vehicle.id = :vehicleId ORDER BY f.mileageAtRefuel DESC LIMIT 1")
    Optional<FuelLog> findLastRefuelByVehicleId(@Param("vehicleId") Long vehicleId);

    long countByVehicleId(Long vehicleId);

    List<FuelLog> findByVehicleCompanyIdOrderByDateDesc(Long companyId);
}
