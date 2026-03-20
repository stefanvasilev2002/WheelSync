package com.wheelsync.service;

import com.wheelsync.dto.report.*;
import com.wheelsync.entity.Defect;
import com.wheelsync.entity.FuelLog;
import com.wheelsync.entity.MileageLog;
import com.wheelsync.entity.ServiceRecord;
import com.wheelsync.entity.Vehicle;
import com.wheelsync.exception.AccessDeniedException;
import com.wheelsync.exception.ResourceNotFoundException;
import com.wheelsync.repository.*;
import com.wheelsync.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class VehicleReportService {

    private final VehicleRepository vehicleRepository;
    private final VehicleAssignmentRepository vehicleAssignmentRepository;
    private final MileageLogRepository mileageLogRepository;
    private final FuelLogRepository fuelLogRepository;
    private final ServiceRecordRepository serviceRecordRepository;
    private final DefectRepository defectRepository;

    @Transactional(readOnly = true)
    public VehicleReportResponse getReport(Long vehicleId, UserPrincipal principal) {
        Vehicle vehicle;
        if (isAdmin(principal)) {
            vehicle = vehicleRepository.findById(vehicleId)
                    .orElseThrow(() -> new ResourceNotFoundException("Vehicle", vehicleId));
        } else {
            Long companyId = requireCompanyId(principal);
            vehicle = vehicleRepository.findByIdAndCompanyId(vehicleId, companyId)
                    .orElseThrow(() -> new ResourceNotFoundException("Vehicle", vehicleId));
        }

        // Current driver
        String assignedDriver = vehicleAssignmentRepository.findByVehicleIdAndIsActiveTrue(vehicleId)
                .map(a -> a.getDriver().getFullName())
                .orElse(null);

        // Service records
        List<ServiceRecord> serviceRecords = serviceRecordRepository.findByVehicleIdOrderByDateDesc(vehicleId);
        List<ReportServiceRow> serviceRows = serviceRecords.stream()
                .map(r -> ReportServiceRow.builder()
                        .date(r.getDate())
                        .serviceType(r.getServiceType().name())
                        .mileage(r.getMileage())
                        .cost(r.getCost())
                        .location(r.getLocation())
                        .description(r.getDescription())
                        .build())
                .collect(Collectors.toList());

        BigDecimal totalServiceCost = serviceRecords.stream()
                .map(ServiceRecord::getCost)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Fuel logs
        List<FuelLog> fuelLogs = fuelLogRepository.findByVehicleIdOrderByDateDesc(vehicleId);
        List<ReportFuelRow> fuelRows = fuelLogs.stream()
                .map(l -> ReportFuelRow.builder()
                        .date(l.getDate())
                        .fuelType(l.getFuelType().name())
                        .quantityLiters(l.getQuantityLiters())
                        .pricePerLiter(l.getPricePerLiter())
                        .totalPrice(l.getTotalPrice())
                        .mileageAtRefuel(l.getMileageAtRefuel())
                        .consumption(l.getConsumption())
                        .location(l.getLocation())
                        .build())
                .collect(Collectors.toList());

        BigDecimal totalFuelCost = fuelLogs.stream()
                .map(FuelLog::getTotalPrice)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Mileage logs
        List<MileageLog> mileageLogs = mileageLogRepository.findByVehicleIdOrderByDateDesc(vehicleId);
        List<ReportMileageRow> mileageRows = mileageLogs.stream()
                .map(l -> ReportMileageRow.builder()
                        .date(l.getDate())
                        .startMileage(l.getStartMileage())
                        .endMileage(l.getEndMileage())
                        .distance(l.getDistance() != null ? l.getDistance() : l.getEndMileage() - l.getStartMileage())
                        .note(l.getNote())
                        .driverName(l.getDriver().getFullName())
                        .build())
                .collect(Collectors.toList());

        long totalDistanceKm = mileageLogs.stream()
                .mapToLong(l -> l.getDistance() != null ? l.getDistance() : 0L)
                .sum();

        // Defects
        List<Defect> defects = defectRepository.findByVehicleIdOrderByCreatedAtDesc(vehicleId);
        List<ReportDefectRow> defectRows = defects.stream()
                .map(d -> ReportDefectRow.builder()
                        .reportedAt(d.getCreatedAt())
                        .title(d.getTitle())
                        .priority(d.getPriority().name())
                        .status(d.getStatus().name())
                        .resolutionNote(d.getResolutionNote())
                        .build())
                .collect(Collectors.toList());

        return VehicleReportResponse.builder()
                .vehicleId(vehicle.getId())
                .make(vehicle.getMake())
                .model(vehicle.getModel())
                .year(vehicle.getYear())
                .vin(vehicle.getVin())
                .licensePlate(vehicle.getLicensePlate())
                .color(vehicle.getColor())
                .engineType(vehicle.getEngineType())
                .fuelType(vehicle.getFuelType().name())
                .currentMileage(vehicle.getCurrentMileage())
                .assignedDriverName(assignedDriver)
                .totalServiceCost(totalServiceCost)
                .totalFuelCost(totalFuelCost)
                .totalCost(totalServiceCost.add(totalFuelCost))
                .totalDistanceKm(totalDistanceKm)
                .services(serviceRows)
                .fuelLogs(fuelRows)
                .mileageLogs(mileageRows)
                .defects(defectRows)
                .build();
    }

    private boolean isAdmin(UserPrincipal principal) {
        return principal.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
    }

    private Long requireCompanyId(UserPrincipal principal) {
        Long companyId = principal.getCompanyId();
        if (companyId == null) {
            throw new AccessDeniedException("User is not associated with a company");
        }
        return companyId;
    }
}
