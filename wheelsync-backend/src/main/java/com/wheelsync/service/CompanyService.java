package com.wheelsync.service;

import com.wheelsync.dto.company.CompanyRequest;
import com.wheelsync.dto.company.CompanyResponse;
import com.wheelsync.entity.Company;
import com.wheelsync.exception.ResourceNotFoundException;
import com.wheelsync.repository.CompanyRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CompanyService {

    private final CompanyRepository companyRepository;

    @Transactional(readOnly = true)
    public List<CompanyResponse> getAll() {
        return companyRepository.findAll()
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public CompanyResponse getById(Long id) {
        Company company = companyRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Компанија", id));
        return toResponse(company);
    }

    @Transactional
    public CompanyResponse create(CompanyRequest request) {
        Company company = Company.builder()
                .name(request.getName())
                .address(request.getAddress())
                .phone(request.getPhone())
                .contactPerson(request.getContactPerson())
                .build();
        company = companyRepository.save(company);
        return toResponse(company);
    }

    @Transactional
    public CompanyResponse update(Long id, CompanyRequest request) {
        Company company = companyRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Компанија", id));

        company.setName(request.getName());
        company.setAddress(request.getAddress());
        company.setPhone(request.getPhone());
        company.setContactPerson(request.getContactPerson());

        company = companyRepository.save(company);
        return toResponse(company);
    }

    @Transactional
    public void delete(Long id) {
        if (!companyRepository.existsById(id)) {
            throw new ResourceNotFoundException("Компанија", id);
        }
        companyRepository.deleteById(id);
    }

    public CompanyResponse toResponse(Company company) {
        int userCount = company.getUsers() != null ? company.getUsers().size() : 0;
        int vehicleCount = company.getVehicles() != null
                ? (int) company.getVehicles().stream()
                        .filter(v -> Boolean.TRUE.equals(v.getIsActive()))
                        .count()
                : 0;

        return CompanyResponse.builder()
                .id(company.getId())
                .name(company.getName())
                .address(company.getAddress())
                .phone(company.getPhone())
                .contactPerson(company.getContactPerson())
                .createdAt(company.getCreatedAt())
                .userCount(userCount)
                .vehicleCount(vehicleCount)
                .build();
    }
}
