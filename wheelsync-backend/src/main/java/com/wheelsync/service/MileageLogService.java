package com.wheelsync.service;

import com.wheelsync.dto.mileage.MileageLogRequest;
import com.wheelsync.dto.mileage.MileageLogResponse;
import com.wheelsync.entity.MileageLog;
import com.wheelsync.entity.User;
import com.wheelsync.entity.Vehicle;
import com.wheelsync.entity.enums.Role;
import com.wheelsync.exception.AccessDeniedException;
import com.wheelsync.exception.ResourceNotFoundException;
import com.wheelsync.repository.MileageLogRepository;
import com.wheelsync.repository.UserRepository;
import com.wheelsync.repository.VehicleAssignmentRepository;
import com.wheelsync.repository.VehicleRepository;
import com.wheelsync.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MileageLogService {

    private final MileageLogRepository mileageLogRepository;
    private final VehicleRepository vehicleRepository;
    private final VehicleAssignmentRepository vehicleAssignmentRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public List<MileageLogResponse> getByVehicle(Long vehicleId, UserPrincipal principal) {
        Long companyId = requireCompanyId(principal);
        vehicleRepository.findByIdAndCompanyId(vehicleId, companyId)
                .orElseThrow(() -> new ResourceNotFoundException("Возило", vehicleId));

        return mileageLogRepository.findByVehicleIdOrderByDateDesc(vehicleId).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<MileageLogResponse> getByDriver(Long driverId, UserPrincipal principal) {
        boolean isAdmin = isAdmin(principal);
        if (!isAdmin) {
            Long companyId = requireCompanyId(principal);
            User driver = userRepository.findById(driverId)
                    .orElseThrow(() -> new ResourceNotFoundException("Возач", driverId));
            if (driver.getCompany() == null || !companyId.equals(driver.getCompany().getId())) {
                throw new AccessDeniedException("Немате пристап до логовите на овој возач");
            }
        }

        return mileageLogRepository.findByDriverIdOrderByDateDesc(driverId).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<MileageLogResponse> getMyLogs(UserPrincipal principal) {
        return mileageLogRepository.findByDriverIdOrderByDateDesc(principal.getId()).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<MileageLogResponse> getLogs(UserPrincipal principal) {
        if (isDriver(principal)) {
            return getMyLogs(principal);
        }
        Long companyId = requireCompanyId(principal);
        return mileageLogRepository.findByVehicleCompanyIdOrderByDateDesc(companyId).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public MileageLogResponse create(MileageLogRequest request, UserPrincipal principal) {
        Long companyId = requireCompanyId(principal);

        Vehicle vehicle = vehicleRepository.findByIdAndCompanyId(request.getVehicleId(), companyId)
                .orElseThrow(() -> new ResourceNotFoundException("Возило", request.getVehicleId()));

        if (!Boolean.TRUE.equals(vehicle.getIsActive())) {
            throw new IllegalArgumentException("Возилото е деактивирано");
        }

        // Drivers must have an active assignment on this vehicle
        boolean isDriver = isDriver(principal);
        if (isDriver) {
            boolean hasActiveAssignment = vehicleAssignmentRepository
                    .findByVehicleIdAndIsActiveTrue(request.getVehicleId())
                    .map(a -> a.getDriver().getId().equals(principal.getId()))
                    .orElse(false);
            if (!hasActiveAssignment) {
                throw new AccessDeniedException("Немате активно задолжување за ова возило");
            }
        }

        if (request.getEndMileage() < request.getStartMileage()) {
            throw new IllegalArgumentException("Крајната километража не може да биде помала од почетната");
        }

        User driver = userRepository.findById(principal.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Корисник", principal.getId()));

        MileageLog log = MileageLog.builder()
                .vehicle(vehicle)
                .driver(driver)
                .date(request.getDate())
                .startMileage(request.getStartMileage())
                .endMileage(request.getEndMileage())
                .note(request.getNote())
                .build();

        log = mileageLogRepository.save(log);

        // Update vehicle current mileage
        if (request.getEndMileage() > vehicle.getCurrentMileage()) {
            vehicle.setCurrentMileage(request.getEndMileage());
            vehicleRepository.save(vehicle);
        }

        return toResponse(log);
    }

    public MileageLogResponse toResponse(MileageLog log) {
        // distance is computed by DB (end - start), but may be null before refresh
        Integer distance = log.getDistance() != null
                ? log.getDistance()
                : (log.getEndMileage() - log.getStartMileage());

        return MileageLogResponse.builder()
                .id(log.getId())
                .vehicleId(log.getVehicle().getId())
                .vehicleDisplayName(log.getVehicle().getDisplayName())
                .driverId(log.getDriver().getId())
                .driverName(log.getDriver().getFullName())
                .date(log.getDate())
                .startMileage(log.getStartMileage())
                .endMileage(log.getEndMileage())
                .distance(distance)
                .note(log.getNote())
                .createdAt(log.getCreatedAt())
                .build();
    }

    private boolean isAdmin(UserPrincipal principal) {
        return principal.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
    }

    private boolean isDriver(UserPrincipal principal) {
        return principal.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_DRIVER"));
    }

    private Long requireCompanyId(UserPrincipal principal) {
        Long companyId = principal.getCompanyId();
        if (companyId == null) {
            throw new AccessDeniedException("Корисникот не е поврзан со компанија");
        }
        return companyId;
    }
}
