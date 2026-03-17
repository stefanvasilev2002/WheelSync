package com.wheelsync.repository;

import com.wheelsync.entity.ServiceRecord;
import com.wheelsync.entity.enums.ServiceType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ServiceRecordRepository extends JpaRepository<ServiceRecord, Long> {
    List<ServiceRecord> findByVehicleIdOrderByDateDesc(Long vehicleId);
    List<ServiceRecord> findByVehicleIdAndServiceTypeOrderByDateDesc(Long vehicleId, ServiceType serviceType);
    Optional<ServiceRecord> findTopByVehicleIdAndServiceTypeOrderByDateDesc(Long vehicleId, ServiceType serviceType);
}
