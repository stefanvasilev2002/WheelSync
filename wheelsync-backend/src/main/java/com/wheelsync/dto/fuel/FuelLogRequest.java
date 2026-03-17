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

    @NotNull(message = "Возилото е задолжително")
    private Long vehicleId;

    @NotNull(message = "Датумот е задолжителен")
    private LocalDate date;

    @NotNull(message = "Типот на гориво е задолжителен")
    private FuelType fuelType;

    @NotNull(message = "Количеството е задолжително")
    @DecimalMin(value = "0.01", message = "Количеството мора да биде поголемо од 0")
    private BigDecimal quantityLiters;

    @NotNull(message = "Цената по литар е задолжителна")
    @DecimalMin(value = "0.01", message = "Цената по литар мора да биде поголема од 0")
    private BigDecimal pricePerLiter;

    @NotNull(message = "Километражата при точење е задолжителна")
    @Min(value = 0, message = "Километражата не може да биде негативна")
    private Integer mileageAtRefuel;

    private String location;
}
