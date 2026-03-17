package com.wheelsync.repository;

import com.wheelsync.entity.VehicleAssignment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface VehicleAssignmentRepository extends JpaRepository<VehicleAssignment, Long> {
    Optional<VehicleAssignment> findByVehicleIdAndIsActiveTrue(Long vehicleId);
    List<VehicleAssignment> findByDriverIdAndIsActiveTrue(Long driverId);
    List<VehicleAssignment> findByVehicleIdOrderByAssignedDateDesc(Long vehicleId);
    boolean existsByVehicleIdAndIsActiveTrue(Long vehicleId);
}
