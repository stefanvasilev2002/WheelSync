package com.wheelsync.dto.fuel;

import com.wheelsync.entity.enums.FuelType;
import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Builder
public class FuelLogResponse {

    private Long id;
    private Long vehicleId;
    private String vehicleDisplayName;
    private Long driverId;
    private String driverName;
    private LocalDate date;
    private FuelType fuelType;
    private BigDecimal quantityLiters;
    private BigDecimal pricePerLiter;
    private BigDecimal totalPrice;
    private Integer mileageAtRefuel;
    private BigDecimal consumption;
    private String location;
    private LocalDateTime createdAt;
}
