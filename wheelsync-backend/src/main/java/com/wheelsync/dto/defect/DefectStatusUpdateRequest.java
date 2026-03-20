package com.wheelsync.dto.defect;

import com.wheelsync.entity.enums.DefectStatus;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DefectStatusUpdateRequest {

    @NotNull
    private DefectStatus status;

    private String resolutionNote;

    private LocalDate resolvedDate;

    private Long serviceRecordId;
}
