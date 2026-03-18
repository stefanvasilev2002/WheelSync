package com.wheelsync.dto.fuel;

import com.wheelsync.entity.enums.FuelType;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FuelLogRequest {

    @NotNull(message = "Vehicle is required")
    private Long vehicleId;

    @NotNull(message = "Date is required")
    private LocalDate date;

    @NotNull(message = "Fuel type is required")
    private FuelType fuelType;

    @NotNull(message = "Quantity is required")
    @DecimalMin(value = "0.01", message = "Quantity must be greater than 0")
    private BigDecimal quantityLiters;

    @NotNull(message = "Price per liter is required")
    @DecimalMin(value = "0.01", message = "Price per liter must be greater than 0")
    private BigDecimal pricePerLiter;

    @NotNull(message = "Mileage at refuel is required")
    @Min(value = 0, message = "Mileage cannot be negative")
    private Integer mileageAtRefuel;

    private String location;
}
