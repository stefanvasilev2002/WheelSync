package com.wheelsync.dto.user;

import com.wheelsync.entity.enums.Role;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserUpdateRequest {

    @NotBlank(message = "Името е задолжително")
    private String firstName;

    @NotBlank(message = "Презимето е задолжително")
    private String lastName;

    private String phone;

    private Role role;

    private Long companyId;

    private Boolean isActive;
}
