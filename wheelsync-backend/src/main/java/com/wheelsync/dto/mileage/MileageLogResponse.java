package com.wheelsync.dto.mileage;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Builder
public class MileageLogResponse {

    private Long id;
    private Long vehicleId;
    private String vehicleDisplayName;
    private Long driverId;
    private String driverName;
    private LocalDate date;
    private Integer startMileage;
    private Integer endMileage;
    private Integer distance;
    private String note;
    private LocalDateTime createdAt;
}
