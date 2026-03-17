package com.wheelsync.repository;

import com.wheelsync.entity.Defect;
import com.wheelsync.entity.enums.DefectStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DefectRepository extends JpaRepository<Defect, Long> {
    List<Defect> findByVehicleIdOrderByCreatedAtDesc(Long vehicleId);
    List<Defect> findByVehicleCompanyIdAndStatusNotOrderByCreatedAtDesc(Long companyId, DefectStatus status);
    List<Defect> findByReportedByIdOrderByCreatedAtDesc(Long userId);
    long countByVehicleCompanyIdAndStatusNot(Long companyId, DefectStatus status);
}
