package com.wheelsync.controller;

import com.wheelsync.dto.common.ApiResponse;
import com.wheelsync.dto.company.CompanyRequest;
import com.wheelsync.dto.company.CompanyResponse;
import com.wheelsync.service.CompanyService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/companies")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class CompanyController {

    private final CompanyService companyService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<CompanyResponse>>> getAll() {
        return ResponseEntity.ok(ApiResponse.ok(companyService.getAll()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<CompanyResponse>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(companyService.getById(id)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<CompanyResponse>> create(
            @Valid @RequestBody CompanyRequest request) {
        CompanyResponse response = companyService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Компанијата е успешно креирана", response));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<CompanyResponse>> update(
            @PathVariable Long id,
            @Valid @RequestBody CompanyRequest request) {
        CompanyResponse response = companyService.update(id, request);
        return ResponseEntity.ok(ApiResponse.ok("Компанијата е успешно ажурирана", response));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        companyService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
