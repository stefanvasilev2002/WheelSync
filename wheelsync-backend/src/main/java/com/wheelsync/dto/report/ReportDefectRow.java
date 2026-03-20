package com.wheelsync.dto.report;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class ReportDefectRow {
    private LocalDateTime reportedAt;
    private String title;
    private String priority;
    private String status;
    private String resolutionNote;
}
