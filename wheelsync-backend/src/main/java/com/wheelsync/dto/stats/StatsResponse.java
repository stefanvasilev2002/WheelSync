package com.wheelsync.dto.stats;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Data
@Builder
public class StatsResponse {
    // Fleet overview
    private int totalVehicles;
    private int assignedVehicles;
    private int unassignedVehicles;

    // Logs
    private int totalMileageLogs;
    private long totalDistanceKm;
    private int totalFuelLogs;
    private BigDecimal totalFuelCost;

    // Service
    private int totalServiceRecords;
    private BigDecimal totalServiceCost;

    // Defects
    private long openDefects;
    private long resolvedDefects;

    // Reminders
    private long dueSoonReminders;

    // Per-vehicle breakdown (top 5 by distance)
    private List<VehicleStatRow> topVehiclesByDistance;

    // Monthly costs (last 12 months): key = "YYYY-MM"
    private List<MonthlyCostRow> monthlyCosts;

    // Cost by service type: key = service type enum name
    private Map<String, BigDecimal> costByServiceType;
}
