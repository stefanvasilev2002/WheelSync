package com.wheelsync.dto.service;

import com.wheelsync.entity.enums.ServiceRecordStatus;
import com.wheelsync.entity.enums.ServiceType;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ServiceRecordRequest {

    @NotNull
    private Long vehicleId;

    @NotNull
    private ServiceType serviceType;

    @NotNull
    private LocalDate date;

    @NotNull
    private Integer mileage;

    private String location;

    @NotNull
    private BigDecimal cost;

    private String description;

    private ServiceRecordStatus status;
}
