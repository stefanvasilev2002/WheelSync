package com.wheelsync.dto.report;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;

@Data
@Builder
public class ReportMileageRow {
    private LocalDate date;
    private int startMileage;
    private int endMileage;
    private int distance;
    private String note;
    private String driverName;
}
