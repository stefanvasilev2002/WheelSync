package com.wheelsync.dto.vehicle;

import com.wheelsync.entity.enums.FuelType;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VehicleRequest {

    @NotBlank(message = "Make is required")
    private String make;

    @NotBlank(message = "Model is required")
    private String model;

    @NotNull(message = "Year is required")
    @Min(value = 1900, message = "Year cannot be before 1900")
    @Max(value = 2030, message = "Year cannot be after 2030")
    private Integer year;

    @NotBlank(message = "VIN number is required")
    @Size(min = 17, max = 17, message = "VIN number must contain exactly 17 characters")
    private String vin;

    @NotBlank(message = "License plate is required")
    private String licensePlate;

    private String color;

    private String engineType;

    @NotNull(message = "Fuel type is required")
    private FuelType fuelType;

    @Min(value = 0, message = "Mileage cannot be negative")
    private Integer currentMileage;

    /** Required when an ADMIN creates a vehicle (they have no company in JWT) */
    private Long companyId;
}
