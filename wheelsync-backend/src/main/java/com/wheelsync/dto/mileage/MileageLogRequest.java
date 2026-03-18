package com.wheelsync.dto.mileage;

import jakarta.validation.constraints.Min;
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
public class MileageLogRequest {

    @NotNull(message = "Vehicle is required")
    private Long vehicleId;

    @NotNull(message = "Date is required")
    private LocalDate date;

    @NotNull(message = "Start mileage is required")
    @Min(value = 0, message = "Start mileage cannot be negative")
    private Integer startMileage;

    @NotNull(message = "End mileage is required")
    @Min(value = 0, message = "End mileage cannot be negative")
    private Integer endMileage;

    private String note;
}
