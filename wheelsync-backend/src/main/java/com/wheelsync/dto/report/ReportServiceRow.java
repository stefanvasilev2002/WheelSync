package com.wheelsync.dto.report;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@Builder
public class ReportServiceRow {
    private LocalDate date;
    private String serviceType;
    private int mileage;
    private BigDecimal cost;
    private String location;
    private String description;
}
