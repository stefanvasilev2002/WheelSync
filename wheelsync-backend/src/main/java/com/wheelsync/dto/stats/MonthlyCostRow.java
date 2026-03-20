package com.wheelsync.dto.stats;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MonthlyCostRow {
    private String month; // YYYY-MM
    private BigDecimal fuelCost;
    private BigDecimal serviceCost;
    private BigDecimal totalCost;
}
