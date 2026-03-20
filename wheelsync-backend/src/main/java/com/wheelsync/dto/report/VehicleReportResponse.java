package com.wheelsync.dto.report;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
public class VehicleReportResponse {

    // Vehicle info
    private Long vehicleId;
    private String make;
    private String model;
    private int year;
    private String vin;
    private String licensePlate;
    private String color;
    private String engineType;
    private String fuelType;
    private int currentMileage;

    // Current assignment
    private String assignedDriverName;

    // Totals
    private BigDecimal totalServiceCost;
    private BigDecimal totalFuelCost;
    private BigDecimal totalCost;
    private long totalDistanceKm;

    // Records
    private List<ReportServiceRow> services;
    private List<ReportFuelRow> fuelLogs;
    private List<ReportMileageRow> mileageLogs;
    private List<ReportDefectRow> defects;
}
