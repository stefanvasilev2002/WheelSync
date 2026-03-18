package com.wheelsync.dto.defect;

import com.wheelsync.entity.enums.DefectPriority;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DefectRequest {

    @NotNull
    private Long vehicleId;

    @NotBlank
    private String title;

    private String description;

    @NotNull
    private DefectPriority priority;
}
