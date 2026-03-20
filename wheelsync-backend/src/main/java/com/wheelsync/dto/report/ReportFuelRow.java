package com.wheelsync.dto.report;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@Builder
public class ReportFuelRow {
    private LocalDate date;
    private String fuelType;
    private BigDecimal quantityLiters;
    private BigDecimal pricePerLiter;
    private BigDecimal totalPrice;
    private int mileageAtRefuel;
    private BigDecimal consumption;
    private String location;
}
