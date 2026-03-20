package com.wheelsync.service;

import com.wheelsync.dto.stats.MonthlyCostRow;
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
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.*;
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

    private boolean isAdmin(UserPrincipal principal) {
        return principal.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
    }

    @Transactional(readOnly = true)
    public StatsResponse getStats(UserPrincipal principal) {
        boolean admin = isAdmin(principal);

        List<Vehicle> vehicles = admin
                ? vehicleRepository.findAll().stream().filter(v -> Boolean.TRUE.equals(v.getIsActive())).collect(Collectors.toList())
                : vehicleRepository.findByCompanyId(requireCompanyId(principal));
        int totalVehicles = vehicles.size();

        long assignedVehicles = vehicles.stream()
                .filter(v -> vehicleAssignmentRepository.existsByVehicleIdAndIsActiveTrue(v.getId()))
                .count();
        long unassignedVehicles = totalVehicles - assignedVehicles;

        Set<Long> vehicleIds = vehicles.stream().map(Vehicle::getId).collect(Collectors.toSet());

        // Mileage logs
        List<MileageLog> mileageLogs = admin
                ? mileageLogRepository.findAll()
                : mileageLogRepository.findByVehicleCompanyIdOrderByDateDesc(requireCompanyId(principal));
        long totalDistanceKm = mileageLogs.stream()
                .mapToLong(l -> l.getDistance() != null ? l.getDistance() : 0L)
                .sum();

        // Fuel logs
        List<FuelLog> fuelLogs = admin
                ? fuelLogRepository.findAll()
                : fuelLogRepository.findByVehicleCompanyIdOrderByDateDesc(requireCompanyId(principal));
        BigDecimal totalFuelCost = fuelLogs.stream()
                .map(FuelLog::getTotalPrice)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Service records — derived from vehicle list so admin is already handled
        List<ServiceRecord> serviceRecords = vehicles.stream()
                .flatMap(v -> serviceRecordRepository.findByVehicleIdOrderByDateDesc(v.getId()).stream())
                .collect(Collectors.toList());
        BigDecimal totalServiceCost = serviceRecords.stream()
                .map(ServiceRecord::getCost)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Defects
        long openDefects = admin
                ? defectRepository.findAll().stream().filter(d -> d.getStatus() != DefectStatus.RESOLVED).count()
                : defectRepository.countByVehicleCompanyIdAndStatusNot(requireCompanyId(principal), DefectStatus.RESOLVED);
        long resolvedDefects = admin
                ? defectRepository.findAll().stream().filter(d -> d.getStatus() == DefectStatus.RESOLVED).count()
                : defectRepository.findByVehicleCompanyIdAndStatusNotOrderByCreatedAtDesc(
                        requireCompanyId(principal), DefectStatus.REPORTED).stream()
                        .filter(d -> d.getStatus() == DefectStatus.RESOLVED).count();

        // Due-soon reminders
        LocalDate checkDate = LocalDate.now().plusDays(14);
        long dueSoonReminders = reminderRepository.findAllDueSoon(checkDate).stream()
                .filter(r -> vehicleIds.contains(r.getVehicle().getId()))
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

        // Average fuel consumption per vehicle: L/100km from non-null consumption logs
        Map<Long, BigDecimal> vehicleAvgConsumption = fuelLogs.stream()
                .filter(l -> l.getConsumption() != null)
                .collect(Collectors.groupingBy(
                        l -> l.getVehicle().getId(),
                        Collectors.collectingAndThen(
                                Collectors.toList(),
                                list -> {
                                    BigDecimal sum = list.stream()
                                            .map(FuelLog::getConsumption)
                                            .reduce(BigDecimal.ZERO, BigDecimal::add);
                                    return sum.divide(BigDecimal.valueOf(list.size()), 2, RoundingMode.HALF_UP);
                                }
                        )
                ));

        List<VehicleStatRow> topVehiclesByDistance = vehicles.stream()
                .map(v -> VehicleStatRow.builder()
                        .vehicleId(v.getId())
                        .vehicleName(v.getDisplayName() + " - " + v.getLicensePlate())
                        .distanceKm(vehicleDistance.getOrDefault(v.getId(), 0L))
                        .fuelCost(vehicleFuelCost.getOrDefault(v.getId(), BigDecimal.ZERO))
                        .avgConsumption(vehicleAvgConsumption.get(v.getId()))
                        .build())
                .sorted(Comparator.comparingLong(VehicleStatRow::getDistanceKm).reversed())
                .limit(5)
                .collect(Collectors.toList());

        // Monthly costs: last 12 months
        YearMonth now = YearMonth.now();
        List<MonthlyCostRow> monthlyCosts = new ArrayList<>();
        for (int i = 11; i >= 0; i--) {
            YearMonth month = now.minusMonths(i);
            String monthKey = month.toString(); // YYYY-MM

            BigDecimal fuelCostMonth = fuelLogs.stream()
                    .filter(l -> YearMonth.from(l.getDate()).equals(month))
                    .map(FuelLog::getTotalPrice)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            BigDecimal serviceCostMonth = serviceRecords.stream()
                    .filter(r -> YearMonth.from(r.getDate()).equals(month))
                    .map(ServiceRecord::getCost)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            monthlyCosts.add(MonthlyCostRow.builder()
                    .month(monthKey)
                    .fuelCost(fuelCostMonth)
                    .serviceCost(serviceCostMonth)
                    .totalCost(fuelCostMonth.add(serviceCostMonth))
                    .build());
        }

        // Cost by service type
        Map<String, BigDecimal> costByServiceType = serviceRecords.stream()
                .collect(Collectors.groupingBy(
                        r -> r.getServiceType().name(),
                        Collectors.reducing(BigDecimal.ZERO, ServiceRecord::getCost, BigDecimal::add)
                ));

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
                .monthlyCosts(monthlyCosts)
                .costByServiceType(costByServiceType)
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
