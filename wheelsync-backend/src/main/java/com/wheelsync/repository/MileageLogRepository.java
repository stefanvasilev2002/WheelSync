package com.wheelsync.repository;

import com.wheelsync.entity.MileageLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MileageLogRepository extends JpaRepository<MileageLog, Long> {
    List<MileageLog> findByVehicleIdOrderByDateDesc(Long vehicleId);
    List<MileageLog> findByDriverIdOrderByDateDesc(Long driverId);

    @Query("SELECT m FROM MileageLog m WHERE m.vehicle.id = :vehicleId ORDER BY m.endMileage DESC")
    Optional<MileageLog> findTopByVehicleIdOrderByEndMileageDesc(@Param("vehicleId") Long vehicleId);

    @Query("SELECT MAX(m.endMileage) FROM MileageLog m WHERE m.vehicle.id = :vehicleId")
    Optional<Integer> findMaxEndMileageByVehicleId(@Param("vehicleId") Long vehicleId);
}
