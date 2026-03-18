package com.wheelsync.dto.vehicle;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AssignVehicleRequest {

    @NotNull(message = "Driver is required")
    private Long driverId;

    @NotNull(message = "Assignment date is required")
    private LocalDate assignedDate;
}
