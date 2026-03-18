package com.wheelsync.dto.reminder;

import com.wheelsync.entity.enums.IntervalType;
import com.wheelsync.entity.enums.ServiceType;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
public class MaintenanceReminderResponse {
    private Long id;
    private Long vehicleId;
    private String vehicleName;
    private ServiceType serviceType;
    private IntervalType intervalType;
    private Integer mileageInterval;
    private Integer dateIntervalMonths;
    private LocalDate lastServiceDate;
    private Integer lastServiceMileage;
    private LocalDate nextDueDate;
    private Integer nextDueMileage;
    private Integer warningThresholdKm;
    private Integer warningThresholdDays;
    private Boolean isActive;
    private Boolean isDueSoon;
    private LocalDateTime createdAt;
}
