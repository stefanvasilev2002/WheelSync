package com.wheelsync.service;

import com.wheelsync.dto.service.ServiceDocumentResponse;
import com.wheelsync.dto.service.ServiceRecordRequest;
import com.wheelsync.dto.service.ServiceRecordResponse;
import com.wheelsync.entity.ServiceDocument;
import com.wheelsync.entity.ServiceRecord;
import com.wheelsync.entity.User;
import com.wheelsync.entity.Vehicle;
import com.wheelsync.entity.enums.ServiceRecordStatus;
import com.wheelsync.exception.AccessDeniedException;
import com.wheelsync.exception.ResourceNotFoundException;
import com.wheelsync.entity.MaintenanceReminder;
import com.wheelsync.entity.enums.IntervalType;
import com.wheelsync.repository.MaintenanceReminderRepository;
import com.wheelsync.repository.ServiceDocumentRepository;
import com.wheelsync.repository.ServiceRecordRepository;
import com.wheelsync.repository.UserRepository;
import com.wheelsync.repository.VehicleAssignmentRepository;
import com.wheelsync.repository.VehicleRepository;
import com.wheelsync.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ServiceRecordService {

    private static final Set<String> ALLOWED_CONTENT_TYPES = Set.of(
            "application/pdf", "image/jpeg", "image/png"
    );
    private static final Set<String> ALLOWED_EXTENSIONS = Set.of("pdf", "jpg", "jpeg", "png");

    private final ServiceRecordRepository serviceRecordRepository;
    private final ServiceDocumentRepository serviceDocumentRepository;
    private final VehicleRepository vehicleRepository;
    private final UserRepository userRepository;
    private final VehicleAssignmentRepository vehicleAssignmentRepository;
    private final MaintenanceReminderRepository maintenanceReminderRepository;
    private final Path fileStorageLocation;

    @Transactional(readOnly = true)
    public List<ServiceRecordResponse> getByVehicle(Long vehicleId, UserPrincipal principal) {
        Long companyId = requireCompanyId(principal);
        vehicleRepository.findByIdAndCompanyId(vehicleId, companyId)
                .orElseThrow(() -> new ResourceNotFoundException("Vehicle", vehicleId));
        return serviceRecordRepository.findByVehicleIdOrderByDateDesc(vehicleId).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ServiceRecordResponse> getByCompany(UserPrincipal principal) {
        List<Vehicle> vehicles = isAdmin(principal)
                ? vehicleRepository.findAll().stream().filter(v -> Boolean.TRUE.equals(v.getIsActive())).collect(Collectors.toList())
                : vehicleRepository.findByCompanyId(requireCompanyId(principal));
        return vehicles.stream()
                .flatMap(v -> serviceRecordRepository.findByVehicleIdOrderByDateDesc(v.getId()).stream())
                .sorted((a, b) -> b.getDate().compareTo(a.getDate()))
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ServiceRecordResponse getById(Long id, UserPrincipal principal) {
        ServiceRecord record = findAndVerifyAccess(id, principal);
        return toResponse(record);
    }

    @Transactional
    public ServiceRecordResponse create(ServiceRecordRequest req, UserPrincipal principal) {
        boolean driver = isDriver(principal);

        Vehicle vehicle;
        if (isAdmin(principal)) {
            vehicle = vehicleRepository.findById(req.getVehicleId())
                    .orElseThrow(() -> new ResourceNotFoundException("Vehicle", req.getVehicleId()));
        } else if (driver) {
            // Driver must have an active assignment on the requested vehicle
            Long companyId = requireCompanyId(principal);
            vehicle = vehicleRepository.findByIdAndCompanyId(req.getVehicleId(), companyId)
                    .orElseThrow(() -> new ResourceNotFoundException("Vehicle", req.getVehicleId()));
            boolean hasAssignment = vehicleAssignmentRepository
                    .findByVehicleIdAndIsActiveTrue(req.getVehicleId())
                    .map(a -> a.getDriver().getId().equals(principal.getId()))
                    .orElse(false);
            if (!hasAssignment) {
                throw new AccessDeniedException("You do not have an active assignment for this vehicle");
            }
        } else {
            vehicle = vehicleRepository.findByIdAndCompanyId(req.getVehicleId(), requireCompanyId(principal))
                    .orElseThrow(() -> new ResourceNotFoundException("Vehicle", req.getVehicleId()));
        }

        User createdBy = userRepository.findById(principal.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User", principal.getId()));

        // Drivers always submit with PENDING status — FM/Admin can set any status
        ServiceRecordStatus status = driver
                ? ServiceRecordStatus.PENDING
                : (req.getStatus() != null ? req.getStatus() : ServiceRecordStatus.CONFIRMED);

        ServiceRecord record = ServiceRecord.builder()
                .vehicle(vehicle)
                .serviceType(req.getServiceType())
                .date(req.getDate())
                .mileage(req.getMileage())
                .location(req.getLocation())
                .cost(req.getCost())
                .description(req.getDescription())
                .status(status)
                .createdBy(createdBy)
                .build();

        record = serviceRecordRepository.save(record);

        // FR-9.5 — Auto-reset the matching maintenance reminder (if any) by advancing its due dates
        resetMatchingReminder(req.getVehicleId(), req.getServiceType(), req.getDate(), req.getMileage());

        return toResponse(record);
    }

    @Transactional
    public ServiceRecordResponse update(Long id, ServiceRecordRequest req, UserPrincipal principal) {
        ServiceRecord record = findAndVerifyAccess(id, principal);
        Vehicle vehicle = isAdmin(principal)
                ? vehicleRepository.findById(req.getVehicleId())
                        .orElseThrow(() -> new ResourceNotFoundException("Vehicle", req.getVehicleId()))
                : vehicleRepository.findByIdAndCompanyId(req.getVehicleId(), requireCompanyId(principal))
                        .orElseThrow(() -> new ResourceNotFoundException("Vehicle", req.getVehicleId()));

        record.setVehicle(vehicle);
        record.setServiceType(req.getServiceType());
        record.setDate(req.getDate());
        record.setMileage(req.getMileage());
        record.setLocation(req.getLocation());
        record.setCost(req.getCost());
        record.setDescription(req.getDescription());
        if (req.getStatus() != null) {
            record.setStatus(req.getStatus());
        }

        record = serviceRecordRepository.save(record);
        return toResponse(record);
    }

    @Transactional
    public void delete(Long id, UserPrincipal principal) {
        ServiceRecord record = findAndVerifyAccess(id, principal);
        // Delete physical files first
        List<ServiceDocument> docs = serviceDocumentRepository.findByServiceRecordId(id);
        for (ServiceDocument doc : docs) {
            deletePhysicalFile(doc.getFilePath());
        }
        serviceRecordRepository.delete(record);
    }

    @Transactional
    public ServiceDocumentResponse uploadDocument(Long serviceRecordId, MultipartFile file, UserPrincipal principal) {
        ServiceRecord record = findAndVerifyAccess(serviceRecordId, principal);

        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null || originalFilename.isBlank()) {
            throw new IllegalArgumentException("File name is required");
        }

        String extension = getExtension(originalFilename).toLowerCase();
        if (!ALLOWED_EXTENSIONS.contains(extension)) {
            throw new IllegalArgumentException("Only PDF, JPG, and PNG files are allowed");
        }

        String contentType = file.getContentType();
        if (contentType != null && !ALLOWED_CONTENT_TYPES.contains(contentType)) {
            throw new IllegalArgumentException("Only PDF, JPG, and PNG files are allowed");
        }

        // Build storage path: uploads/documents/{serviceRecordId}/
        Path dir = fileStorageLocation.resolve("documents").resolve(String.valueOf(serviceRecordId));
        try {
            Files.createDirectories(dir);
        } catch (IOException e) {
            throw new RuntimeException("Could not create document directory", e);
        }

        String storedFileName = UUID.randomUUID() + "." + extension;
        Path targetPath = dir.resolve(storedFileName);
        try {
            Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException e) {
            throw new RuntimeException("Could not save file", e);
        }

        ServiceDocument doc = ServiceDocument.builder()
                .serviceRecord(record)
                .fileName(originalFilename)
                .filePath(targetPath.toString())
                .fileType(extension.toUpperCase())
                .fileSize(file.getSize())
                .build();

        doc = serviceDocumentRepository.save(doc);
        return toDocumentResponse(doc);
    }

    @Transactional(readOnly = true)
    public Resource downloadDocument(Long documentId, UserPrincipal principal) {
        ServiceDocument doc = serviceDocumentRepository.findById(documentId)
                .orElseThrow(() -> new ResourceNotFoundException("Document", documentId));

        // Verify access via the service record's vehicle company
        findAndVerifyAccess(doc.getServiceRecord().getId(), principal);

        try {
            Path filePath = Path.of(doc.getFilePath());
            Resource resource = new UrlResource(filePath.toUri());
            if (!resource.exists()) {
                throw new ResourceNotFoundException("Document file", documentId);
            }
            return resource;
        } catch (MalformedURLException e) {
            throw new RuntimeException("Could not read file", e);
        }
    }

    @Transactional
    public void deleteDocument(Long documentId, UserPrincipal principal) {
        ServiceDocument doc = serviceDocumentRepository.findById(documentId)
                .orElseThrow(() -> new ResourceNotFoundException("Document", documentId));

        findAndVerifyAccess(doc.getServiceRecord().getId(), principal);

        deletePhysicalFile(doc.getFilePath());
        serviceDocumentRepository.delete(doc);
    }

    // --- Helpers ---

    /**
     * FR-9.5 — When a service record is created, find any matching active maintenance reminder
     * for the same vehicle + service type and advance its next-due values based on its interval.
     */
    private void resetMatchingReminder(Long vehicleId, com.wheelsync.entity.enums.ServiceType serviceType,
                                        java.time.LocalDate serviceDate, Integer serviceMileage) {
        maintenanceReminderRepository
                .findByVehicleIdAndServiceTypeAndIsActiveTrue(vehicleId, serviceType)
                .ifPresent(reminder -> {
                    reminder.setLastServiceDate(serviceDate);
                    reminder.setLastServiceMileage(serviceMileage);

                    if (reminder.getIntervalType() == IntervalType.DATE && reminder.getDateIntervalMonths() != null) {
                        reminder.setNextDueDate(serviceDate.plusMonths(reminder.getDateIntervalMonths()));
                    }

                    if (reminder.getIntervalType() == IntervalType.MILEAGE && reminder.getMileageInterval() != null) {
                        reminder.setNextDueMileage(serviceMileage + reminder.getMileageInterval());
                    }

                    if (reminder.getIntervalType() == IntervalType.BOTH) {
                        if (reminder.getDateIntervalMonths() != null) {
                            reminder.setNextDueDate(serviceDate.plusMonths(reminder.getDateIntervalMonths()));
                        }
                        if (reminder.getMileageInterval() != null) {
                            reminder.setNextDueMileage(serviceMileage + reminder.getMileageInterval());
                        }
                    }

                    maintenanceReminderRepository.save(reminder);
                });
    }

    private ServiceRecord findAndVerifyAccess(Long id, UserPrincipal principal) {
        ServiceRecord record = serviceRecordRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Service record", id));

        if (!isAdmin(principal)) {
            Long companyId = requireCompanyId(principal);
            if (!record.getVehicle().getCompany().getId().equals(companyId)) {
                throw new AccessDeniedException("Access denied to this service record");
            }
        }
        return record;
    }

    private void deletePhysicalFile(String filePath) {
        try {
            Files.deleteIfExists(Path.of(filePath));
        } catch (IOException e) {
            // Log but don't fail
        }
    }

    private String getExtension(String filename) {
        int dotIndex = filename.lastIndexOf('.');
        return dotIndex >= 0 ? filename.substring(dotIndex + 1) : "";
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
            throw new AccessDeniedException("User is not associated with a company");
        }
        return companyId;
    }

    public ServiceRecordResponse toResponse(ServiceRecord record) {
        List<ServiceDocumentResponse> docs = record.getDocuments().stream()
                .map(this::toDocumentResponse)
                .collect(Collectors.toList());

        return ServiceRecordResponse.builder()
                .id(record.getId())
                .vehicleId(record.getVehicle().getId())
                .vehicleName(record.getVehicle().getDisplayName() + " - " + record.getVehicle().getLicensePlate())
                .serviceType(record.getServiceType())
                .date(record.getDate())
                .mileage(record.getMileage())
                .location(record.getLocation())
                .cost(record.getCost())
                .description(record.getDescription())
                .status(record.getStatus())
                .createdByName(record.getCreatedBy() != null ? record.getCreatedBy().getFullName() : null)
                .documents(docs)
                .createdAt(record.getCreatedAt())
                .build();
    }

    public ServiceDocumentResponse toDocumentResponse(ServiceDocument doc) {
        return ServiceDocumentResponse.builder()
                .id(doc.getId())
                .fileName(doc.getFileName())
                .fileType(doc.getFileType())
                .fileSize(doc.getFileSize())
                .createdAt(doc.getCreatedAt())
                .build();
    }
}
