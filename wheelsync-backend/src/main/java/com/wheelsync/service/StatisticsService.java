package com.wheelsync.service;

import com.wheelsync.dto.stats.StatsResponse;
import com.wheelsync.dto.stats.VehicleStatRow;
import com.wheelsync.entity.FuelLog;
import com.wheelsync.entity.MileageLog;
import com.wheelsync.entity.ServiceRecord;
import com.wheelsync.entity.Vehicle;
import com.wheelsync.entity.enums.DefectStatus;
import com.wheelsync.exception.AccessDeniedException;
import com.wheelsync.repository.*;
import com.wheelsync.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class StatisticsService {

    private final VehicleRepository vehicleRepository;
    private final VehicleAssignmentRepository vehicleAssignmentRepository;
    private final MileageLogRepository mileageLogRepository;
    private final FuelLogRepository fuelLogRepository;
    private final ServiceRecordRepository serviceRecordRepository;
    private final DefectRepository defectRepository;
    private final MaintenanceReminderRepository reminderRepository;

    @Transactional(readOnly = true)
    public StatsResponse getStats(UserPrincipal principal) {
        Long companyId = requireCompanyId(principal);

        List<Vehicle> vehicles = vehicleRepository.findByCompanyId(companyId);
        int totalVehicles = vehicles.size();

        long assignedVehicles = vehicles.stream()
                .filter(v -> vehicleAssignmentRepository.existsByVehicleIdAndIsActiveTrue(v.getId()))
                .count();
        long unassignedVehicles = totalVehicles - assignedVehicles;

        // Mileage logs
        List<MileageLog> mileageLogs = mileageLogRepository.findByVehicleCompanyIdOrderByDateDesc(companyId);
        long totalDistanceKm = mileageLogs.stream()
                .mapToLong(l -> l.getDistance() != null ? l.getDistance() : 0L)
                .sum();

        // Fuel logs
        List<FuelLog> fuelLogs = fuelLogRepository.findByVehicleCompanyIdOrderByDateDesc(companyId);
        BigDecimal totalFuelCost = fuelLogs.stream()
                .map(FuelLog::getTotalPrice)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Service records
        List<ServiceRecord> serviceRecords = vehicles.stream()
                .flatMap(v -> serviceRecordRepository.findByVehicleIdOrderByDateDesc(v.getId()).stream())
                .collect(Collectors.toList());
        BigDecimal totalServiceCost = serviceRecords.stream()
                .map(ServiceRecord::getCost)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Defects
        long openDefects = defectRepository.countByVehicleCompanyIdAndStatusNot(companyId, DefectStatus.RESOLVED);
        long resolvedDefects = defectRepository.findByVehicleCompanyIdAndStatusNotOrderByCreatedAtDesc(
                companyId, DefectStatus.REPORTED).stream()
                .filter(d -> d.getStatus() == DefectStatus.RESOLVED)
                .count();

        // Due-soon reminders
        LocalDate checkDate = LocalDate.now().plusDays(14);
        long dueSoonReminders = reminderRepository.findAllDueSoon(checkDate).stream()
                .filter(r -> r.getVehicle().getCompany().getId().equals(companyId))
                .count();

        // Per-vehicle breakdown: top 5 by distance
        Map<Long, Long> vehicleDistance = mileageLogs.stream()
                .collect(Collectors.groupingBy(
                        l -> l.getVehicle().getId(),
                        Collectors.summingLong(l -> l.getDistance() != null ? l.getDistance() : 0L)
                ));

        Map<Long, BigDecimal> vehicleFuelCost = fuelLogs.stream()
                .collect(Collectors.groupingBy(
                        l -> l.getVehicle().getId(),
                        Collectors.reducing(BigDecimal.ZERO, FuelLog::getTotalPrice, BigDecimal::add)
                ));

        List<VehicleStatRow> topVehiclesByDistance = vehicles.stream()
                .map(v -> VehicleStatRow.builder()
                        .vehicleId(v.getId())
                        .vehicleName(v.getDisplayName() + " - " + v.getLicensePlate())
                        .distanceKm(vehicleDistance.getOrDefault(v.getId(), 0L))
                        .fuelCost(vehicleFuelCost.getOrDefault(v.getId(), BigDecimal.ZERO))
                        .build())
                .sorted(Comparator.comparingLong(VehicleStatRow::getDistanceKm).reversed())
                .limit(5)
                .collect(Collectors.toList());

        return StatsResponse.builder()
                .totalVehicles(totalVehicles)
                .assignedVehicles((int) assignedVehicles)
                .unassignedVehicles((int) unassignedVehicles)
                .totalMileageLogs(mileageLogs.size())
                .totalDistanceKm(totalDistanceKm)
                .totalFuelLogs(fuelLogs.size())
                .totalFuelCost(totalFuelCost)
                .totalServiceRecords(serviceRecords.size())
                .totalServiceCost(totalServiceCost)
                .openDefects(openDefects)
                .resolvedDefects(resolvedDefects)
                .dueSoonReminders(dueSoonReminders)
                .topVehiclesByDistance(topVehiclesByDistance)
                .build();
    }

    private Long requireCompanyId(UserPrincipal principal) {
        Long companyId = principal.getCompanyId();
        if (companyId == null) {
            throw new AccessDeniedException("User is not associated with a company");
        }
        return companyId;
    }
}
