package com.wheelsync.dto.user;

import com.wheelsync.entity.enums.Role;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class UserResponse {

    private Long id;
    private String firstName;
    private String lastName;
    private String email;
    private String phone;
    private Role role;
    private Long companyId;
    private String companyName;
    private Boolean isActive;
    private LocalDateTime createdAt;
}
