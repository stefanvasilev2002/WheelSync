package com.wheelsync.repository;

import com.wheelsync.entity.Vehicle;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface VehicleRepository extends JpaRepository<Vehicle, Long> {
    List<Vehicle> findByCompanyIdAndIsActiveTrue(Long companyId);
    List<Vehicle> findByCompanyId(Long companyId);
    Optional<Vehicle> findByIdAndCompanyId(Long id, Long companyId);
    boolean existsByVin(String vin);
    boolean existsByVinAndIdNot(String vin, Long id);

    @Query("SELECT v FROM Vehicle v WHERE v.company.id = :companyId AND v.isActive = true " +
           "AND (:make IS NULL OR LOWER(v.make) LIKE LOWER(CONCAT('%', :make, '%'))) " +
           "AND (:model IS NULL OR LOWER(v.model) LIKE LOWER(CONCAT('%', :model, '%')))")
    List<Vehicle> searchByCompany(@Param("companyId") Long companyId,
                                  @Param("make") String make,
                                  @Param("model") String model);
}
