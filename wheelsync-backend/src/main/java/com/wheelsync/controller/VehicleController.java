package com.wheelsync.controller;

import com.wheelsync.dto.common.ApiResponse;
import com.wheelsync.dto.vehicle.AssignVehicleRequest;
import com.wheelsync.dto.vehicle.VehicleAssignmentResponse;
import com.wheelsync.dto.vehicle.VehicleRequest;
import com.wheelsync.dto.vehicle.VehicleResponse;
import com.wheelsync.security.UserPrincipal;
import com.wheelsync.service.VehicleAssignmentService;
import com.wheelsync.service.VehicleService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/vehicles")
@RequiredArgsConstructor
public class VehicleController {

    private final VehicleService vehicleService;
    private final VehicleAssignmentService vehicleAssignmentService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'FLEET_MANAGER', 'DRIVER')")
    public ResponseEntity<ApiResponse<List<VehicleResponse>>> getAll(
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(ApiResponse.ok(vehicleService.getAll(principal)));
    }

    @GetMapping("/search")
    @PreAuthorize("hasAnyRole('ADMIN', 'FLEET_MANAGER', 'DRIVER')")
    public ResponseEntity<ApiResponse<List<VehicleResponse>>> search(
            @RequestParam(required = false) String make,
            @RequestParam(required = false) String model,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(ApiResponse.ok(vehicleService.search(make, model, principal)));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'FLEET_MANAGER', 'DRIVER')")
    public ResponseEntity<ApiResponse<VehicleResponse>> getById(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(ApiResponse.ok(vehicleService.getById(id, principal)));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'FLEET_MANAGER')")
    public ResponseEntity<ApiResponse<VehicleResponse>> create(
            @Valid @RequestBody VehicleRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        VehicleResponse response = vehicleService.create(request, principal);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Возилото е успешно креирано", response));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'FLEET_MANAGER')")
    public ResponseEntity<ApiResponse<VehicleResponse>> update(
            @PathVariable Long id,
            @Valid @RequestBody VehicleRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        VehicleResponse response = vehicleService.update(id, request, principal);
        return ResponseEntity.ok(ApiResponse.ok("Возилото е успешно ажурирано", response));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'FLEET_MANAGER')")
    public ResponseEntity<ApiResponse<Void>> softDelete(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal) {
        vehicleService.softDelete(id, principal);
        return ResponseEntity.ok(ApiResponse.ok("Возилото е успешно деактивирано"));
    }

    @PostMapping("/{id}/assign")
    @PreAuthorize("hasAnyRole('ADMIN', 'FLEET_MANAGER')")
    public ResponseEntity<ApiResponse<VehicleAssignmentResponse>> assign(
            @PathVariable Long id,
            @Valid @RequestBody AssignVehicleRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        VehicleAssignmentResponse response = vehicleAssignmentService.assign(id, request, principal);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Возилото е успешно задолжено", response));
    }

    @DeleteMapping("/{id}/assign")
    @PreAuthorize("hasAnyRole('ADMIN', 'FLEET_MANAGER')")
    public ResponseEntity<ApiResponse<VehicleAssignmentResponse>> unassign(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal) {
        VehicleAssignmentResponse response = vehicleAssignmentService.unassign(id, principal);
        return ResponseEntity.ok(ApiResponse.ok("Возилото е успешно раздолжено", response));
    }

    @GetMapping("/{id}/assignments")
    @PreAuthorize("hasAnyRole('ADMIN', 'FLEET_MANAGER')")
    public ResponseEntity<ApiResponse<List<VehicleAssignmentResponse>>> getHistory(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(ApiResponse.ok(vehicleAssignmentService.getHistory(id, principal)));
    }

    @GetMapping("/{id}/assignment")
    @PreAuthorize("hasAnyRole('ADMIN', 'FLEET_MANAGER', 'DRIVER')")
    public ResponseEntity<ApiResponse<VehicleAssignmentResponse>> getActiveAssignment(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(ApiResponse.ok(vehicleAssignmentService.getActiveAssignment(id, principal)));
    }
}
