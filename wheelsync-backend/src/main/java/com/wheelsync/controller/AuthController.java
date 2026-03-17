package com.wheelsync.controller;

import com.wheelsync.dto.auth.*;
import com.wheelsync.dto.common.ApiResponse;
import com.wheelsync.dto.company.CompanyResponse;
import com.wheelsync.service.AuthService;
import com.wheelsync.service.CompanyService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final CompanyService companyService;

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<AuthResponse>> register(
            @Valid @RequestBody RegisterRequest request) {
        AuthResponse response = authService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Регистрацијата е успешна", response));
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(
            @Valid @RequestBody LoginRequest request) {
        AuthResponse response = authService.login(request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<ApiResponse<Void>> forgotPassword(
            @Valid @RequestBody ForgotPasswordRequest request) {
        authService.forgotPassword(request);
        return ResponseEntity.ok(ApiResponse.ok(
                "Ако email адресата постои во системот, ќе добиете линк за ресетирање"));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<ApiResponse<Void>> resetPassword(
            @Valid @RequestBody ResetPasswordRequest request) {
        authService.resetPassword(request);
        return ResponseEntity.ok(ApiResponse.ok("Лозинката е успешно ресетирана"));
    }

    /** Public endpoint for the registration form — returns company names and IDs only */
    @GetMapping("/companies")
    public ResponseEntity<ApiResponse<List<CompanyResponse>>> getCompaniesForRegistration() {
        return ResponseEntity.ok(ApiResponse.ok(companyService.getAll()));
    }
}
