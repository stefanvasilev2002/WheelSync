package com.wheelsync.dto.vehicle;

import com.wheelsync.entity.enums.FuelType;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class VehicleResponse {

    private Long id;
    private String make;
    private String model;
    private Integer year;
    private String vin;
    private String licensePlate;
    private String color;
    private String engineType;
    private FuelType fuelType;
    private Integer currentMileage;
    private Boolean isActive;
    private Long companyId;
    private String companyName;
    private Long assignedDriverId;
    private String assignedDriverName;
}
