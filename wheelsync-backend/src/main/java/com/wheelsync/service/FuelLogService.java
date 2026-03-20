package com.wheelsync.service;

import com.wheelsync.dto.fuel.FuelLogRequest;
import com.wheelsync.dto.fuel.FuelLogResponse;
import com.wheelsync.entity.FuelLog;
import com.wheelsync.entity.User;
import com.wheelsync.entity.Vehicle;
import com.wheelsync.exception.AccessDeniedException;
import com.wheelsync.exception.ResourceNotFoundException;
import com.wheelsync.repository.FuelLogRepository;
import com.wheelsync.repository.UserRepository;
import com.wheelsync.repository.VehicleAssignmentRepository;
import com.wheelsync.repository.VehicleRepository;
import com.wheelsync.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class FuelLogService {

    private final FuelLogRepository fuelLogRepository;
    private final VehicleRepository vehicleRepository;
    private final VehicleAssignmentRepository vehicleAssignmentRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public List<FuelLogResponse> getByVehicle(Long vehicleId, UserPrincipal principal) {
        Long companyId = requireCompanyId(principal);
        vehicleRepository.findByIdAndCompanyId(vehicleId, companyId)
                .orElseThrow(() -> new ResourceNotFoundException("Vehicle", vehicleId));

        return fuelLogRepository.findByVehicleIdOrderByDateDesc(vehicleId).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<FuelLogResponse> getMyLogs(UserPrincipal principal) {
        return fuelLogRepository.findByDriverIdOrderByDateDesc(principal.getId()).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<FuelLogResponse> getLogs(UserPrincipal principal) {
        if (isDriver(principal)) {
            return getMyLogs(principal);
        }
        if (isAdmin(principal)) {
            return fuelLogRepository.findAll().stream()
                    .sorted((a, b) -> b.getDate().compareTo(a.getDate()))
                    .map(this::toResponse)
                    .collect(Collectors.toList());
        }
        Long companyId = requireCompanyId(principal);
        return fuelLogRepository.findByVehicleCompanyIdOrderByDateDesc(companyId).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    private boolean isAdmin(UserPrincipal principal) {
        return principal.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
    }

    @Transactional
    public FuelLogResponse create(FuelLogRequest request, UserPrincipal principal) {
        Long companyId = requireCompanyId(principal);

        Vehicle vehicle = vehicleRepository.findByIdAndCompanyId(request.getVehicleId(), companyId)
                .orElseThrow(() -> new ResourceNotFoundException("Vehicle", request.getVehicleId()));

        if (!Boolean.TRUE.equals(vehicle.getIsActive())) {
            throw new IllegalArgumentException("Vehicle is deactivated");
        }

        // Drivers must have an active assignment on this vehicle
        boolean isDriver = isDriver(principal);
        if (isDriver) {
            boolean hasActiveAssignment = vehicleAssignmentRepository
                    .findByVehicleIdAndIsActiveTrue(request.getVehicleId())
                    .map(a -> a.getDriver().getId().equals(principal.getId()))
                    .orElse(false);
            if (!hasActiveAssignment) {
                throw new AccessDeniedException("You do not have an active assignment for this vehicle");
            }
        }

        if (request.getMileageAtRefuel() < vehicle.getCurrentMileage()) {
            throw new IllegalArgumentException(
                "Mileage at refuel (" + request.getMileageAtRefuel() +
                " km) cannot be less than the vehicle's current mileage (" +
                vehicle.getCurrentMileage() + " km)");
        }

        User driver = userRepository.findById(principal.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User", principal.getId()));

        // Compute total price
        BigDecimal totalPrice = request.getQuantityLiters()
                .multiply(request.getPricePerLiter())
                .setScale(2, RoundingMode.HALF_UP);

        // Compute consumption (L/100km) based on last refuel
        BigDecimal consumption = computeConsumption(
                request.getVehicleId(),
                request.getMileageAtRefuel(),
                request.getQuantityLiters()
        );

        FuelLog log = FuelLog.builder()
                .vehicle(vehicle)
                .driver(driver)
                .date(request.getDate())
                .fuelType(request.getFuelType())
                .quantityLiters(request.getQuantityLiters())
                .pricePerLiter(request.getPricePerLiter())
                .totalPrice(totalPrice)
                .mileageAtRefuel(request.getMileageAtRefuel())
                .consumption(consumption)
                .location(request.getLocation())
                .build();

        log = fuelLogRepository.save(log);

        // Update vehicle current mileage
        if (request.getMileageAtRefuel() > vehicle.getCurrentMileage()) {
            vehicle.setCurrentMileage(request.getMileageAtRefuel());
            vehicleRepository.save(vehicle);
        }

        return toResponse(log);
    }

    /**
     * Consumption = quantityLiters / (currentMileageAtRefuel - lastMileageAtRefuel) * 100
     * Returns null if this is the first refuel or if the mileage difference is zero.
     */
    private BigDecimal computeConsumption(Long vehicleId, Integer mileageAtRefuel,
                                           BigDecimal quantityLiters) {
        Optional<FuelLog> lastRefuel = fuelLogRepository.findLastRefuelByVehicleId(vehicleId);
        if (lastRefuel.isEmpty()) {
            return null;
        }

        int lastMileage = lastRefuel.get().getMileageAtRefuel();
        int distance = mileageAtRefuel - lastMileage;

        if (distance <= 0) {
            return null;
        }

        // L/100km
        return quantityLiters
                .divide(BigDecimal.valueOf(distance), 10, RoundingMode.HALF_UP)
                .multiply(BigDecimal.valueOf(100))
                .setScale(2, RoundingMode.HALF_UP);
    }

    public FuelLogResponse toResponse(FuelLog log) {
        return FuelLogResponse.builder()
                .id(log.getId())
                .vehicleId(log.getVehicle().getId())
                .vehicleDisplayName(log.getVehicle().getDisplayName())
                .driverId(log.getDriver().getId())
                .driverName(log.getDriver().getFullName())
                .date(log.getDate())
                .fuelType(log.getFuelType())
                .quantityLiters(log.getQuantityLiters())
                .pricePerLiter(log.getPricePerLiter())
                .totalPrice(log.getTotalPrice())
                .mileageAtRefuel(log.getMileageAtRefuel())
                .consumption(log.getConsumption())
                .location(log.getLocation())
                .createdAt(log.getCreatedAt())
                .build();
    }

    private boolean isDriver(UserPrincipal principal) {
        return principal.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_DRIVER"));
    }

    private Long requireCompanyId(UserPrincipal principal) {
        Long companyId = principal.getCompanyId();
        if (companyId == null) {
            throw new AccessDeniedException("User is not associated with a company");
        }
        return companyId;
    }
}
