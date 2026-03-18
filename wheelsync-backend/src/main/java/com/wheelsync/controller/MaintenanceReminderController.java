package com.wheelsync.controller;

import com.wheelsync.dto.common.ApiResponse;
import com.wheelsync.dto.reminder.MaintenanceReminderRequest;
import com.wheelsync.dto.reminder.MaintenanceReminderResponse;
import com.wheelsync.security.UserPrincipal;
import com.wheelsync.service.MaintenanceReminderService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/reminders")
@RequiredArgsConstructor
public class MaintenanceReminderController {

    private final MaintenanceReminderService reminderService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'FLEET_MANAGER')")
    public ResponseEntity<ApiResponse<List<MaintenanceReminderResponse>>> getByCompany(
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(ApiResponse.ok(reminderService.getByCompany(principal)));
    }

    @GetMapping("/vehicle/{vehicleId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'FLEET_MANAGER')")
    public ResponseEntity<ApiResponse<List<MaintenanceReminderResponse>>> getByVehicle(
            @PathVariable Long vehicleId,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(ApiResponse.ok(reminderService.getByVehicle(vehicleId, principal)));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'FLEET_MANAGER')")
    public ResponseEntity<ApiResponse<MaintenanceReminderResponse>> create(
            @Valid @RequestBody MaintenanceReminderRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        MaintenanceReminderResponse response = reminderService.create(request, principal);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Reminder created successfully", response));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'FLEET_MANAGER')")
    public ResponseEntity<ApiResponse<MaintenanceReminderResponse>> update(
            @PathVariable Long id,
            @Valid @RequestBody MaintenanceReminderRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(ApiResponse.ok("Reminder updated successfully",
                reminderService.update(id, request, principal)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'FLEET_MANAGER')")
    public ResponseEntity<ApiResponse<Void>> delete(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal) {
        reminderService.delete(id, principal);
        return ResponseEntity.ok(ApiResponse.ok("Reminder deleted successfully"));
    }
}
