package com.wheelsync.dto.defect;

import com.wheelsync.entity.enums.DefectPriority;
import com.wheelsync.entity.enums.DefectStatus;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
public class DefectResponse {
    private Long id;
    private Long vehicleId;
    private String vehicleName;
    private String reportedByName;
    private String title;
    private String description;
    private DefectPriority priority;
    private DefectStatus status;
    private String resolutionNote;
    private LocalDate resolvedDate;
    private Long serviceRecordId;
    private boolean hasPhoto;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
