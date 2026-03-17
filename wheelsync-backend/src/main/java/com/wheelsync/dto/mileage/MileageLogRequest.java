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

    @NotNull(message = "Возилото е задолжително")
    private Long vehicleId;

    @NotNull(message = "Датумот е задолжителен")
    private LocalDate date;

    @NotNull(message = "Почетната километража е задолжителна")
    @Min(value = 0, message = "Почетната километража не може да биде негативна")
    private Integer startMileage;

    @NotNull(message = "Крајната километража е задолжителна")
    @Min(value = 0, message = "Крајната километража не може да биде негативна")
    private Integer endMileage;

    private String note;
}
