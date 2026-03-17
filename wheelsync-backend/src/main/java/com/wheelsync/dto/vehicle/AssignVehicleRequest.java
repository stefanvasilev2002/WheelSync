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

    @NotNull(message = "Возачот е задолжителен")
    private Long driverId;

    @NotNull(message = "Датумот на задолжување е задолжителен")
    private LocalDate assignedDate;
}
