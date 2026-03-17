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

    @NotBlank(message = "Марката е задолжителна")
    private String make;

    @NotBlank(message = "Моделот е задолжителен")
    private String model;

    @NotNull(message = "Годината е задолжителна")
    @Min(value = 1900, message = "Годината не може да биде пред 1900")
    @Max(value = 2030, message = "Годината не може да биде по 2030")
    private Integer year;

    @NotBlank(message = "VIN бројот е задолжителен")
    @Size(min = 17, max = 17, message = "VIN бројот мора да содржи точно 17 карактери")
    private String vin;

    @NotBlank(message = "Регистарскиот број е задолжителен")
    private String licensePlate;

    private String color;

    private String engineType;

    @NotNull(message = "Типот на гориво е задолжителен")
    private FuelType fuelType;

    @Min(value = 0, message = "Километражата не може да биде негативна")
    private Integer currentMileage;
}
