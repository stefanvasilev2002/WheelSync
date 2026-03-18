package com.wheelsync.controller;

import com.wheelsync.dto.common.ApiResponse;
import com.wheelsync.dto.mileage.MileageLogRequest;
import com.wheelsync.dto.mileage.MileageLogResponse;
import com.wheelsync.security.UserPrincipal;
import com.wheelsync.service.MileageLogService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/mileage")
@RequiredArgsConstructor
public class MileageLogController {

    private final MileageLogService mileageLogService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'FLEET_MANAGER', 'DRIVER')")
    public ResponseEntity<ApiResponse<List<MileageLogResponse>>> getMyLogs(
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(ApiResponse.ok(mileageLogService.getLogs(principal)));
    }

    @GetMapping("/vehicle/{vehicleId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'FLEET_MANAGER')")
    public ResponseEntity<ApiResponse<List<MileageLogResponse>>> getByVehicle(
            @PathVariable Long vehicleId,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(ApiResponse.ok(mileageLogService.getByVehicle(vehicleId, principal)));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'FLEET_MANAGER', 'DRIVER')")
    public ResponseEntity<ApiResponse<MileageLogResponse>> create(
            @Valid @RequestBody MileageLogRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        MileageLogResponse response = mileageLogService.create(request, principal);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Mileage log saved successfully", response));
    }
}
