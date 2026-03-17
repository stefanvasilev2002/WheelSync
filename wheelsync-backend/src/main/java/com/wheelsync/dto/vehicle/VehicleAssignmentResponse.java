package com.wheelsync.dto.vehicle;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDate;

@Getter
@Builder
public class VehicleAssignmentResponse {

    private Long id;
    private Long vehicleId;
    private String vehicleDisplayName;
    private Long driverId;
    private String driverName;
    private String driverEmail;
    private LocalDate assignedDate;
    private LocalDate unassignedDate;
    private Boolean isActive;
}
