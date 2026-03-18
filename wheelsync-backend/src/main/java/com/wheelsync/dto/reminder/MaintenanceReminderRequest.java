package com.wheelsync.dto.reminder;

import com.wheelsync.entity.enums.IntervalType;
import com.wheelsync.entity.enums.ServiceType;
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
public class MaintenanceReminderRequest {

    @NotNull
    private Long vehicleId;

    @NotNull
    private ServiceType serviceType;

    @NotNull
    private IntervalType intervalType;

    private Integer mileageInterval;

    private Integer dateIntervalMonths;

    private LocalDate lastServiceDate;

    private Integer lastServiceMileage;

    private Integer warningThresholdKm;

    private Integer warningThresholdDays;
}
