package com.wheelsync.dto.service;

import com.wheelsync.entity.enums.ServiceRecordStatus;
import com.wheelsync.entity.enums.ServiceType;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class ServiceRecordResponse {
    private Long id;
    private Long vehicleId;
    private String vehicleName;
    private ServiceType serviceType;
    private LocalDate date;
    private Integer mileage;
    private String location;
    private BigDecimal cost;
    private String description;
    private ServiceRecordStatus status;
    private String createdByName;
    private List<ServiceDocumentResponse> documents;
    private LocalDateTime createdAt;
}
