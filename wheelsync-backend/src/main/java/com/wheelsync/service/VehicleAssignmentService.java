package com.wheelsync.service;

import com.wheelsync.dto.vehicle.AssignVehicleRequest;
import com.wheelsync.dto.vehicle.VehicleAssignmentResponse;
import com.wheelsync.entity.User;
import com.wheelsync.entity.Vehicle;
import com.wheelsync.entity.VehicleAssignment;
import com.wheelsync.entity.enums.Role;
import com.wheelsync.exception.AccessDeniedException;
import com.wheelsync.exception.ResourceNotFoundException;
import com.wheelsync.repository.UserRepository;
import com.wheelsync.repository.VehicleAssignmentRepository;
import com.wheelsync.repository.VehicleRepository;
import com.wheelsync.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class VehicleAssignmentService {

    private final VehicleRepository vehicleRepository;
    private final VehicleAssignmentRepository vehicleAssignmentRepository;
    private final UserRepository userRepository;
    private final EmailService emailService;

    @Transactional
    public VehicleAssignmentResponse assign(Long vehicleId, AssignVehicleRequest request,
                                            UserPrincipal principal) {
        Long companyId = requireCompanyId(principal);

        Vehicle vehicle = vehicleRepository.findByIdAndCompanyId(vehicleId, companyId)
                .orElseThrow(() -> new ResourceNotFoundException("Vehicle", vehicleId));

        if (!Boolean.TRUE.equals(vehicle.getIsActive())) {
            throw new IllegalArgumentException("Vehicle is deactivated and cannot be assigned");
        }

        User driver = userRepository.findById(request.getDriverId())
                .orElseThrow(() -> new ResourceNotFoundException("Driver", request.getDriverId()));

        if (driver.getCompany() == null || !companyId.equals(driver.getCompany().getId())) {
            throw new IllegalArgumentException("The driver does not belong to your company");
        }

        if (driver.getRole() != Role.DRIVER) {
            throw new IllegalArgumentException("The user does not have the DRIVER role");
        }

        if (!Boolean.TRUE.equals(driver.getIsActive())) {
            throw new IllegalArgumentException("Driver is deactivated");
        }

        // Unassign any existing active assignment for this vehicle.
        // Use saveAndFlush so the UPDATE reaches the DB before the INSERT below,
        // otherwise the partial unique index (vehicle_id WHERE is_active=TRUE) is violated.
        Optional<VehicleAssignment> existingAssignment =
                vehicleAssignmentRepository.findByVehicleIdAndIsActiveTrue(vehicleId);
        existingAssignment.ifPresent(a -> {
            a.setUnassignedDate(LocalDate.now());
            a.setIsActive(false);
            vehicleAssignmentRepository.saveAndFlush(a);
        });

        VehicleAssignment assignment = VehicleAssignment.builder()
                .vehicle(vehicle)
                .driver(driver)
                .assignedDate(request.getAssignedDate())
                .isActive(true)
                .build();

        assignment = vehicleAssignmentRepository.save(assignment);

        emailService.sendVehicleAssignmentEmail(
                driver.getEmail(),
                driver.getFullName(),
                vehicle.getDisplayName()
        );

        return toResponse(assignment);
    }

    @Transactional
    public VehicleAssignmentResponse unassign(Long vehicleId, UserPrincipal principal) {
        Long companyId = requireCompanyId(principal);

        vehicleRepository.findByIdAndCompanyId(vehicleId, companyId)
                .orElseThrow(() -> new ResourceNotFoundException("Vehicle", vehicleId));

        VehicleAssignment assignment = vehicleAssignmentRepository
                .findByVehicleIdAndIsActiveTrue(vehicleId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "No active assignment found for vehicle with ID " + vehicleId));

        assignment.setUnassignedDate(LocalDate.now());
        assignment.setIsActive(false);
        assignment = vehicleAssignmentRepository.save(assignment);

        return toResponse(assignment);
    }

    @Transactional(readOnly = true)
    public List<VehicleAssignmentResponse> getHistory(Long vehicleId, UserPrincipal principal) {
        Long companyId = requireCompanyId(principal);

        vehicleRepository.findByIdAndCompanyId(vehicleId, companyId)
                .orElseThrow(() -> new ResourceNotFoundException("Vehicle", vehicleId));

        return vehicleAssignmentRepository.findByVehicleIdOrderByAssignedDateDesc(vehicleId).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public VehicleAssignmentResponse getActiveAssignment(Long vehicleId, UserPrincipal principal) {
        Long companyId = requireCompanyId(principal);

        vehicleRepository.findByIdAndCompanyId(vehicleId, companyId)
                .orElseThrow(() -> new ResourceNotFoundException("Vehicle", vehicleId));

        VehicleAssignment assignment = vehicleAssignmentRepository
                .findByVehicleIdAndIsActiveTrue(vehicleId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "No active assignment found for vehicle with ID " + vehicleId));

        return toResponse(assignment);
    }

    public VehicleAssignmentResponse toResponse(VehicleAssignment assignment) {
        return VehicleAssignmentResponse.builder()
                .id(assignment.getId())
                .vehicleId(assignment.getVehicle().getId())
                .vehicleDisplayName(assignment.getVehicle().getDisplayName())
                .driverId(assignment.getDriver().getId())
                .driverName(assignment.getDriver().getFullName())
                .driverEmail(assignment.getDriver().getEmail())
                .assignedDate(assignment.getAssignedDate())
                .unassignedDate(assignment.getUnassignedDate())
                .isActive(assignment.getIsActive())
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
