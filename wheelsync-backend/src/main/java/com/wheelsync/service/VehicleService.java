package com.wheelsync.service;

import com.wheelsync.dto.vehicle.VehicleRequest;
import com.wheelsync.dto.vehicle.VehicleResponse;
import com.wheelsync.entity.Company;
import com.wheelsync.entity.Vehicle;
import com.wheelsync.entity.VehicleAssignment;
import com.wheelsync.exception.AccessDeniedException;
import com.wheelsync.exception.ResourceNotFoundException;
import com.wheelsync.repository.CompanyRepository;
import com.wheelsync.repository.VehicleAssignmentRepository;
import com.wheelsync.repository.VehicleRepository;
import com.wheelsync.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class VehicleService {

    private final VehicleRepository vehicleRepository;
    private final CompanyRepository companyRepository;
    private final VehicleAssignmentRepository vehicleAssignmentRepository;

    @Transactional(readOnly = true)
    public List<VehicleResponse> getAll(UserPrincipal principal) {
        boolean isAdmin = isAdmin(principal);
        if (isAdmin) {
            return vehicleRepository.findAll().stream()
                    .filter(v -> Boolean.TRUE.equals(v.getIsActive()))
                    .map(this::toResponse)
                    .collect(Collectors.toList());
        }
        Long companyId = requireCompanyId(principal);
        return vehicleRepository.findByCompanyIdAndIsActiveTrue(companyId).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public VehicleResponse getById(Long id, UserPrincipal principal) {
        Vehicle vehicle = findVehicleWithCompanyCheck(id, principal);
        return toResponse(vehicle);
    }

    @Transactional
    public VehicleResponse create(VehicleRequest request, UserPrincipal principal) {
        Long companyId;
        if (isAdmin(principal)) {
            if (request.getCompanyId() == null) {
                throw new IllegalArgumentException("Admin must select a company for the vehicle");
            }
            companyId = request.getCompanyId();
        } else {
            companyId = requireCompanyId(principal);
        }

        if (vehicleRepository.existsByVin(request.getVin())) {
            throw new IllegalArgumentException("Vehicle with VIN " + request.getVin() + " already exists");
        }

        Company company = companyRepository.findById(companyId)
                .orElseThrow(() -> new ResourceNotFoundException("Company", companyId));

        Vehicle vehicle = Vehicle.builder()
                .company(company)
                .make(request.getMake())
                .model(request.getModel())
                .year(request.getYear())
                .vin(request.getVin())
                .licensePlate(request.getLicensePlate())
                .color(request.getColor())
                .engineType(request.getEngineType())
                .fuelType(request.getFuelType())
                .currentMileage(request.getCurrentMileage() != null ? request.getCurrentMileage() : 0)
                .isActive(true)
                .build();

        vehicle = vehicleRepository.save(vehicle);
        return toResponse(vehicle);
    }

    @Transactional
    public VehicleResponse update(Long id, VehicleRequest request, UserPrincipal principal) {
        Vehicle vehicle = findVehicleWithCompanyCheck(id, principal);

        if (vehicleRepository.existsByVinAndIdNot(request.getVin(), id)) {
            throw new IllegalArgumentException("Vehicle with VIN " + request.getVin() + " already exists");
        }

        vehicle.setMake(request.getMake());
        vehicle.setModel(request.getModel());
        vehicle.setYear(request.getYear());
        vehicle.setVin(request.getVin());
        vehicle.setLicensePlate(request.getLicensePlate());
        vehicle.setColor(request.getColor());
        vehicle.setEngineType(request.getEngineType());
        vehicle.setFuelType(request.getFuelType());
        if (request.getCurrentMileage() != null) {
            vehicle.setCurrentMileage(request.getCurrentMileage());
        }

        vehicle = vehicleRepository.save(vehicle);
        return toResponse(vehicle);
    }

    @Transactional
    public void softDelete(Long id, UserPrincipal principal) {
        Vehicle vehicle = findVehicleWithCompanyCheck(id, principal);
        vehicle.setIsActive(false);
        vehicleRepository.save(vehicle);
    }

    @Transactional(readOnly = true)
    public List<VehicleResponse> getMyVehicles(UserPrincipal principal) {
        return vehicleAssignmentRepository.findByDriverIdAndIsActiveTrue(principal.getId())
                .stream()
                .map(a -> toResponse(a.getVehicle()))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<VehicleResponse> search(String make, String model, UserPrincipal principal) {
        Long companyId = requireCompanyId(principal);
        return vehicleRepository.searchByCompany(companyId, make, model).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public VehicleResponse toResponse(Vehicle vehicle) {
        Optional<VehicleAssignment> activeAssignment =
                vehicleAssignmentRepository.findByVehicleIdAndIsActiveTrue(vehicle.getId());

        Long assignedDriverId = null;
        String assignedDriverName = null;
        if (activeAssignment.isPresent()) {
            VehicleAssignment assignment = activeAssignment.get();
            assignedDriverId = assignment.getDriver().getId();
            assignedDriverName = assignment.getDriver().getFullName();
        }

        return VehicleResponse.builder()
                .id(vehicle.getId())
                .make(vehicle.getMake())
                .model(vehicle.getModel())
                .year(vehicle.getYear())
                .vin(vehicle.getVin())
                .licensePlate(vehicle.getLicensePlate())
                .color(vehicle.getColor())
                .engineType(vehicle.getEngineType())
                .fuelType(vehicle.getFuelType())
                .currentMileage(vehicle.getCurrentMileage())
                .isActive(vehicle.getIsActive())
                .companyId(vehicle.getCompany().getId())
                .companyName(vehicle.getCompany().getName())
                .assignedDriverId(assignedDriverId)
                .assignedDriverName(assignedDriverName)
                .build();
    }

    private Vehicle findVehicleWithCompanyCheck(Long id, UserPrincipal principal) {
        if (isAdmin(principal)) {
            return vehicleRepository.findById(id)
                    .orElseThrow(() -> new ResourceNotFoundException("Vehicle", id));
        }
        Long companyId = requireCompanyId(principal);
        return vehicleRepository.findByIdAndCompanyId(id, companyId)
                .orElseThrow(() -> new ResourceNotFoundException("Vehicle", id));
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
