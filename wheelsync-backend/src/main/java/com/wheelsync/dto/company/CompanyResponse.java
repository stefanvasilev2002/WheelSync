package com.wheelsync.dto.company;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class CompanyResponse {

    private Long id;
    private String name;
    private String address;
    private String phone;
    private String contactPerson;
    private LocalDateTime createdAt;
    private int userCount;
    private int vehicleCount;
    private Long managerId;
    private String managerName;
}
