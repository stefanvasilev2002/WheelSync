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
import com.wheelsync.repository.UserRepository;
import com.wheelsync.repository.VehicleRepository;
import com.wheelsync.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DefectService {

    private final DefectRepository defectRepository;
    private final VehicleRepository vehicleRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public List<DefectResponse> getByCompany(UserPrincipal principal) {
        if (isDriver(principal)) {
            return defectRepository.findByReportedByIdOrderByCreatedAtDesc(principal.getId()).stream()
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
        Long companyId = requireCompanyId(principal);

        Vehicle vehicle = vehicleRepository.findByIdAndCompanyId(req.getVehicleId(), companyId)
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

        defect.setStatus(req.getStatus());
        if (req.getResolutionNote() != null) {
            defect.setResolutionNote(req.getResolutionNote());
        }
        if (req.getResolvedDate() != null) {
            defect.setResolvedDate(req.getResolvedDate());
        }

        defect = defectRepository.save(defect);
        return toResponse(defect);
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
