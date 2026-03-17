package com.wheelsync.controller;

import com.wheelsync.dto.common.ApiResponse;
import com.wheelsync.dto.fuel.FuelLogRequest;
import com.wheelsync.dto.fuel.FuelLogResponse;
import com.wheelsync.security.UserPrincipal;
import com.wheelsync.service.FuelLogService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/fuel")
@RequiredArgsConstructor
public class FuelLogController {

    private final FuelLogService fuelLogService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'FLEET_MANAGER', 'DRIVER')")
    public ResponseEntity<ApiResponse<List<FuelLogResponse>>> getMyLogs(
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(ApiResponse.ok(fuelLogService.getLogs(principal)));
    }

    @GetMapping("/vehicle/{vehicleId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'FLEET_MANAGER')")
    public ResponseEntity<ApiResponse<List<FuelLogResponse>>> getByVehicle(
            @PathVariable Long vehicleId,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(ApiResponse.ok(fuelLogService.getByVehicle(vehicleId, principal)));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'FLEET_MANAGER', 'DRIVER')")
    public ResponseEntity<ApiResponse<FuelLogResponse>> create(
            @Valid @RequestBody FuelLogRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        FuelLogResponse response = fuelLogService.create(request, principal);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Записот за гориво е успешно зачуван", response));
    }
}
