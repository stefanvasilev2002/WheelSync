package com.wheelsync.service;

import com.wheelsync.dto.defect.DefectRequest;
import com.wheelsync.dto.defect.DefectResponse;
import com.wheelsync.dto.defect.DefectStatusUpdateRequest;
import com.wheelsync.entity.Defect;
import com.wheelsync.entity.User;
import com.wheelsync.entity.Vehicle;
import com.wheelsync.entity.enums.DefectStatus;
import com.wheelsync.exception.AccessDeniedException;
import com.wheelsync.exception.ResourceNotFoundException;
import com.wheelsync.repository.DefectRepository;
import com.wheelsync.repository.ServiceRecordRepository;
import com.wheelsync.repository.UserRepository;
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
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DefectService {

    private final DefectRepository defectRepository;
    private final VehicleRepository vehicleRepository;
    private final UserRepository userRepository;
    private final ServiceRecordRepository serviceRecordRepository;
    private final Path fileStorageLocation;
    private final EmailService emailService;

    @Transactional(readOnly = true)
    public List<DefectResponse> getByCompany(UserPrincipal principal) {
        if (isDriver(principal)) {
            return defectRepository.findByReportedByIdOrderByCreatedAtDesc(principal.getId()).stream()
                    .map(this::toResponse)
                    .collect(Collectors.toList());
        }
        if (isAdmin(principal)) {
            return defectRepository.findAll().stream()
                    .filter(d -> d.getStatus() != DefectStatus.RESOLVED)
                    .map(this::toResponse)
                    .collect(Collectors.toList());
        }
        Long companyId = requireCompanyId(principal);
        return defectRepository.findByVehicleCompanyIdAndStatusNotOrderByCreatedAtDesc(companyId, DefectStatus.RESOLVED)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public DefectResponse getById(Long id, UserPrincipal principal) {
        Defect defect = defectRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Defect", id));

        if (isDriver(principal)) {
            if (!defect.getReportedBy().getId().equals(principal.getId())) {
                throw new AccessDeniedException("Access denied to this defect");
            }
        } else if (!isAdmin(principal)) {
            Long companyId = requireCompanyId(principal);
            if (!defect.getVehicle().getCompany().getId().equals(companyId)) {
                throw new AccessDeniedException("Access denied to this defect");
            }
        }
        return toResponse(defect);
    }

    @Transactional
    public DefectResponse create(DefectRequest req, UserPrincipal principal) {
        Vehicle vehicle = isAdmin(principal)
                ? vehicleRepository.findById(req.getVehicleId())
                        .orElseThrow(() -> new ResourceNotFoundException("Vehicle", req.getVehicleId()))
                : vehicleRepository.findByIdAndCompanyId(req.getVehicleId(), requireCompanyId(principal))
                        .orElseThrow(() -> new ResourceNotFoundException("Vehicle", req.getVehicleId()));

        User reportedBy = userRepository.findById(principal.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User", principal.getId()));

        Defect defect = Defect.builder()
                .vehicle(vehicle)
                .reportedBy(reportedBy)
                .title(req.getTitle())
                .description(req.getDescription())
                .priority(req.getPriority())
                .status(DefectStatus.REPORTED)
                .build();

        defect = defectRepository.save(defect);
        return toResponse(defect);
    }

    @Transactional
    public DefectResponse updateStatus(Long id, DefectStatusUpdateRequest req, UserPrincipal principal) {
        Defect defect = defectRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Defect", id));

        if (!isAdmin(principal)) {
            Long companyId = requireCompanyId(principal);
            if (!defect.getVehicle().getCompany().getId().equals(companyId)) {
                throw new AccessDeniedException("Access denied to this defect");
            }
        }

        DefectStatus previousStatus = defect.getStatus();
        defect.setStatus(req.getStatus());
        if (req.getResolutionNote() != null) {
            defect.setResolutionNote(req.getResolutionNote());
        }
        if (req.getResolvedDate() != null) {
            defect.setResolvedDate(req.getResolvedDate());
        }
        if (req.getServiceRecordId() != null) {
            serviceRecordRepository.findById(req.getServiceRecordId()).ifPresent(defect::setServiceRecord);
        }

        defect = defectRepository.save(defect);

        // Send email notification if status changed
        if (!previousStatus.equals(req.getStatus())) {
            String reporterEmail = defect.getReportedBy().getEmail();
            String reporterName = defect.getReportedBy().getFullName();
            String vehicleDisplay = defect.getVehicle().getDisplayName();
            emailService.sendDefectStatusUpdateEmail(
                    reporterEmail, reporterName, vehicleDisplay,
                    defect.getTitle(), req.getStatus().name().replace('_', ' '));
        }

        return toResponse(defect);
    }

    private static final Set<String> ALLOWED_PHOTO_TYPES = Set.of("image/jpeg", "image/png", "image/jpg");

    @Transactional
    public DefectResponse uploadPhoto(Long id, MultipartFile file, UserPrincipal principal) {
        Defect defect = defectRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Defect", id));

        if (isDriver(principal) && !defect.getReportedBy().getId().equals(principal.getId())) {
            throw new AccessDeniedException("Access denied to this defect");
        }

        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_PHOTO_TYPES.contains(contentType)) {
            throw new IllegalArgumentException("Only JPG/PNG photos are allowed");
        }

        if (file.getSize() > 10 * 1024 * 1024) {
            throw new IllegalArgumentException("Photo must be less than 10MB");
        }

        String ext = contentType.equals("image/png") ? ".png" : ".jpg";
        Path dir = fileStorageLocation.resolve("defects").resolve(String.valueOf(id));
        try {
            Files.createDirectories(dir);
            Path filePath = dir.resolve("photo" + ext);
            Files.copy(file.getInputStream(), filePath, java.nio.file.StandardCopyOption.REPLACE_EXISTING);
            defect.setPhotoPath(filePath.toString());
        } catch (IOException e) {
            throw new RuntimeException("Failed to store photo", e);
        }

        defect = defectRepository.save(defect);
        return toResponse(defect);
    }

    public Resource getPhoto(Long id, UserPrincipal principal) {
        Defect defect = defectRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Defect", id));

        if (isDriver(principal) && !defect.getReportedBy().getId().equals(principal.getId())) {
            throw new AccessDeniedException("Access denied to this defect");
        }

        if (defect.getPhotoPath() == null) {
            throw new ResourceNotFoundException("Photo", id);
        }

        try {
            Path filePath = java.nio.file.Paths.get(defect.getPhotoPath());
            Resource resource = new UrlResource(filePath.toUri());
            if (!resource.exists()) {
                throw new ResourceNotFoundException("Photo", id);
            }
            return resource;
        } catch (MalformedURLException e) {
            throw new RuntimeException("Could not read photo", e);
        }
    }

    // --- Helpers ---

    public DefectResponse toResponse(Defect defect) {
        return DefectResponse.builder()
                .id(defect.getId())
                .vehicleId(defect.getVehicle().getId())
                .vehicleName(defect.getVehicle().getDisplayName() + " - " + defect.getVehicle().getLicensePlate())
                .reportedByName(defect.getReportedBy().getFullName())
                .title(defect.getTitle())
                .description(defect.getDescription())
                .priority(defect.getPriority())
                .status(defect.getStatus())
                .resolutionNote(defect.getResolutionNote())
                .resolvedDate(defect.getResolvedDate())
                .serviceRecordId(defect.getServiceRecord() != null ? defect.getServiceRecord().getId() : null)
                .hasPhoto(defect.getPhotoPath() != null)
                .createdAt(defect.getCreatedAt())
                .updatedAt(defect.getUpdatedAt())
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
            throw new AccessDeniedException("User is not associated with a company");
        }
        return companyId;
    }
}
