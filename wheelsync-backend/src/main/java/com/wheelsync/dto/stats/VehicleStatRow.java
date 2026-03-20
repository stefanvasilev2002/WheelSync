package com.wheelsync.dto.stats;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

@Data
@Builder
public class VehicleStatRow {
    private Long vehicleId;
    private String vehicleName;
    private long distanceKm;
    private BigDecimal fuelCost;
    private BigDecimal avgConsumption; // L/100km, nullable
}
