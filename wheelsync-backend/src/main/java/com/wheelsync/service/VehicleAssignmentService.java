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
                .orElseThrow(() -> new ResourceNotFoundException("Возило", vehicleId));

        if (!Boolean.TRUE.equals(vehicle.getIsActive())) {
            throw new IllegalArgumentException("Возилото е деактивирано и не може да се задолжи");
        }

        User driver = userRepository.findById(request.getDriverId())
                .orElseThrow(() -> new ResourceNotFoundException("Возач", request.getDriverId()));

        if (driver.getCompany() == null || !companyId.equals(driver.getCompany().getId())) {
            throw new IllegalArgumentException("Возачот не припаѓа на вашата компанија");
        }

        if (driver.getRole() != Role.DRIVER) {
            throw new IllegalArgumentException("Корисникот нема улога ВОЗАЧ");
        }

        if (!Boolean.TRUE.equals(driver.getIsActive())) {
            throw new IllegalArgumentException("Возачот е деактивиран");
        }

        // Unassign any existing active assignment for this vehicle
        Optional<VehicleAssignment> existingAssignment =
                vehicleAssignmentRepository.findByVehicleIdAndIsActiveTrue(vehicleId);
        existingAssignment.ifPresent(a -> {
            a.setUnassignedDate(LocalDate.now());
            a.setIsActive(false);
            vehicleAssignmentRepository.save(a);
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
                .orElseThrow(() -> new ResourceNotFoundException("Возило", vehicleId));

        VehicleAssignment assignment = vehicleAssignmentRepository
                .findByVehicleIdAndIsActiveTrue(vehicleId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Нема активно задолжување за возилото со ИД " + vehicleId));

        assignment.setUnassignedDate(LocalDate.now());
        assignment.setIsActive(false);
        assignment = vehicleAssignmentRepository.save(assignment);

        return toResponse(assignment);
    }

    @Transactional(readOnly = true)
    public List<VehicleAssignmentResponse> getHistory(Long vehicleId, UserPrincipal principal) {
        Long companyId = requireCompanyId(principal);

        vehicleRepository.findByIdAndCompanyId(vehicleId, companyId)
                .orElseThrow(() -> new ResourceNotFoundException("Возило", vehicleId));

        return vehicleAssignmentRepository.findByVehicleIdOrderByAssignedDateDesc(vehicleId).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public VehicleAssignmentResponse getActiveAssignment(Long vehicleId, UserPrincipal principal) {
        Long companyId = requireCompanyId(principal);

        vehicleRepository.findByIdAndCompanyId(vehicleId, companyId)
                .orElseThrow(() -> new ResourceNotFoundException("Возило", vehicleId));

        VehicleAssignment assignment = vehicleAssignmentRepository
                .findByVehicleIdAndIsActiveTrue(vehicleId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Нема активно задолжување за возилото со ИД " + vehicleId));

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
            throw new AccessDeniedException("Корисникот не е поврзан со компанија");
        }
        return companyId;
    }
}
