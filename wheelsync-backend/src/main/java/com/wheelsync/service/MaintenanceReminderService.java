package com.wheelsync.service;

import com.wheelsync.dto.reminder.MaintenanceReminderRequest;
import com.wheelsync.dto.reminder.MaintenanceReminderResponse;
import com.wheelsync.entity.MaintenanceReminder;
import com.wheelsync.entity.Vehicle;
import com.wheelsync.entity.enums.IntervalType;
import com.wheelsync.exception.AccessDeniedException;
import com.wheelsync.exception.ResourceNotFoundException;
import com.wheelsync.repository.MaintenanceReminderRepository;
import com.wheelsync.repository.VehicleRepository;
import com.wheelsync.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Service
@RequiredArgsConstructor
public class MaintenanceReminderService {

    private final MaintenanceReminderRepository reminderRepository;
    private final VehicleRepository vehicleRepository;

    @Transactional(readOnly = true)
    public List<MaintenanceReminderResponse> getByVehicle(Long vehicleId, UserPrincipal principal) {
        Vehicle v = isAdmin(principal)
                ? vehicleRepository.findById(vehicleId)
                        .orElseThrow(() -> new ResourceNotFoundException("Vehicle", vehicleId))
                : vehicleRepository.findByIdAndCompanyId(vehicleId, requireCompanyId(principal))
                        .orElseThrow(() -> new ResourceNotFoundException("Vehicle", vehicleId));
        // v used only for access check — actual query uses vehicleId below
        return reminderRepository.findByVehicleIdAndIsActiveTrue(vehicleId).stream()
                .map(r -> toResponse(r, r.getVehicle()))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<MaintenanceReminderResponse> getByCompany(UserPrincipal principal) {
        List<Vehicle> vehicles = isAdmin(principal)
                ? vehicleRepository.findAll().stream().filter(v -> Boolean.TRUE.equals(v.getIsActive())).collect(Collectors.toList())
                : vehicleRepository.findByCompanyId(requireCompanyId(principal));
        return vehicles.stream()
                .flatMap(v -> reminderRepository.findByVehicleIdAndIsActiveTrue(v.getId()).stream()
                        .map(r -> toResponse(r, v)))
                .collect(Collectors.toList());
    }

    @Transactional
    public MaintenanceReminderResponse create(MaintenanceReminderRequest req, UserPrincipal principal) {
        Vehicle vehicle = isAdmin(principal)
                ? vehicleRepository.findById(req.getVehicleId())
                        .orElseThrow(() -> new ResourceNotFoundException("Vehicle", req.getVehicleId()))
                : vehicleRepository.findByIdAndCompanyId(req.getVehicleId(), requireCompanyId(principal))
                        .orElseThrow(() -> new ResourceNotFoundException("Vehicle", req.getVehicleId()));

        LocalDate nextDueDate = computeNextDueDate(req);
        Integer nextDueMileage = computeNextDueMileage(req);

        MaintenanceReminder reminder = MaintenanceReminder.builder()
                .vehicle(vehicle)
                .serviceType(req.getServiceType())
                .intervalType(req.getIntervalType())
                .mileageInterval(req.getMileageInterval())
                .dateIntervalMonths(req.getDateIntervalMonths())
                .lastServiceDate(req.getLastServiceDate())
                .lastServiceMileage(req.getLastServiceMileage())
                .nextDueDate(nextDueDate)
                .nextDueMileage(nextDueMileage)
                .warningThresholdKm(req.getWarningThresholdKm() != null ? req.getWarningThresholdKm() : 1000)
                .warningThresholdDays(req.getWarningThresholdDays() != null ? req.getWarningThresholdDays() : 14)
                .isActive(true)
                .build();

        reminder = reminderRepository.save(reminder);
        return toResponse(reminder, vehicle);
    }

    @Transactional
    public MaintenanceReminderResponse update(Long id, MaintenanceReminderRequest req, UserPrincipal principal) {
        MaintenanceReminder reminder = findAndVerifyAccess(id, principal);
        Vehicle vehicle = isAdmin(principal)
                ? vehicleRepository.findById(req.getVehicleId())
                        .orElseThrow(() -> new ResourceNotFoundException("Vehicle", req.getVehicleId()))
                : vehicleRepository.findByIdAndCompanyId(req.getVehicleId(), requireCompanyId(principal))
                        .orElseThrow(() -> new ResourceNotFoundException("Vehicle", req.getVehicleId()));

        LocalDate nextDueDate = computeNextDueDate(req);
        Integer nextDueMileage = computeNextDueMileage(req);

        reminder.setVehicle(vehicle);
        reminder.setServiceType(req.getServiceType());
        reminder.setIntervalType(req.getIntervalType());
        reminder.setMileageInterval(req.getMileageInterval());
        reminder.setDateIntervalMonths(req.getDateIntervalMonths());
        reminder.setLastServiceDate(req.getLastServiceDate());
        reminder.setLastServiceMileage(req.getLastServiceMileage());
        reminder.setNextDueDate(nextDueDate);
        reminder.setNextDueMileage(nextDueMileage);
        if (req.getWarningThresholdKm() != null) {
            reminder.setWarningThresholdKm(req.getWarningThresholdKm());
        }
        if (req.getWarningThresholdDays() != null) {
            reminder.setWarningThresholdDays(req.getWarningThresholdDays());
        }

        reminder = reminderRepository.save(reminder);
        return toResponse(reminder, vehicle);
    }

    @Transactional
    public void delete(Long id, UserPrincipal principal) {
        MaintenanceReminder reminder = findAndVerifyAccess(id, principal);
        reminder.setIsActive(false);
        reminderRepository.save(reminder);
    }

    public boolean isDueSoon(MaintenanceReminder r) {
        boolean dueSoonByDate = false;
        boolean dueSoonByMileage = false;

        if (r.getNextDueDate() != null && r.getWarningThresholdDays() != null) {
            LocalDate threshold = LocalDate.now().plusDays(r.getWarningThresholdDays());
            dueSoonByDate = !r.getNextDueDate().isAfter(threshold);
        }

        if (r.getNextDueMileage() != null && r.getWarningThresholdKm() != null) {
            int currentMileage = r.getVehicle().getCurrentMileage();
            dueSoonByMileage = (r.getNextDueMileage() - currentMileage) <= r.getWarningThresholdKm();
        }

        return dueSoonByDate || dueSoonByMileage;
    }

    // --- Helpers ---

    private MaintenanceReminder findAndVerifyAccess(Long id, UserPrincipal principal) {
        MaintenanceReminder reminder = reminderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Maintenance reminder", id));

        if (!isAdmin(principal)) {
            Long companyId = requireCompanyId(principal);
            if (!reminder.getVehicle().getCompany().getId().equals(companyId)) {
                throw new AccessDeniedException("Access denied to this reminder");
            }
        }
        return reminder;
    }

    private LocalDate computeNextDueDate(MaintenanceReminderRequest req) {
        boolean usesDate = req.getIntervalType() == IntervalType.DATE
                        || req.getIntervalType() == IntervalType.BOTH;
        if (usesDate && req.getDateIntervalMonths() != null) {
            LocalDate base = req.getLastServiceDate() != null ? req.getLastServiceDate() : LocalDate.now();
            return base.plusMonths(req.getDateIntervalMonths());
        }
        return null;
    }

    private Integer computeNextDueMileage(MaintenanceReminderRequest req) {
        boolean usesMileage = req.getIntervalType() == IntervalType.MILEAGE
                           || req.getIntervalType() == IntervalType.BOTH;
        if (usesMileage && req.getMileageInterval() != null) {
            int base = req.getLastServiceMileage() != null ? req.getLastServiceMileage() : 0;
            return base + req.getMileageInterval();
        }
        return null;
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

    public MaintenanceReminderResponse toResponse(MaintenanceReminder reminder, Vehicle vehicle) {
        return MaintenanceReminderResponse.builder()
                .id(reminder.getId())
                .vehicleId(vehicle.getId())
                .vehicleName(vehicle.getDisplayName() + " - " + vehicle.getLicensePlate())
                .serviceType(reminder.getServiceType())
                .intervalType(reminder.getIntervalType())
                .mileageInterval(reminder.getMileageInterval())
                .dateIntervalMonths(reminder.getDateIntervalMonths())
                .lastServiceDate(reminder.getLastServiceDate())
                .lastServiceMileage(reminder.getLastServiceMileage())
                .nextDueDate(reminder.getNextDueDate())
                .nextDueMileage(reminder.getNextDueMileage())
                .warningThresholdKm(reminder.getWarningThresholdKm())
                .warningThresholdDays(reminder.getWarningThresholdDays())
                .isActive(reminder.getIsActive())
                .isDueSoon(isDueSoon(reminder))
                .createdAt(reminder.getCreatedAt())
                .build();
    }
}
