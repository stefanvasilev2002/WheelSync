package com.wheelsync.controller;

import com.wheelsync.dto.common.ApiResponse;
import com.wheelsync.dto.report.VehicleReportResponse;
import com.wheelsync.security.UserPrincipal;
import com.wheelsync.service.VehicleReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/vehicles")
@RequiredArgsConstructor
public class VehicleReportController {

    private final VehicleReportService vehicleReportService;

    @GetMapping("/{id}/report")
    @PreAuthorize("hasAnyRole('ADMIN', 'FLEET_MANAGER')")
    public ResponseEntity<ApiResponse<VehicleReportResponse>> getReport(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(ApiResponse.ok(vehicleReportService.getReport(id, principal)));
    }
}
