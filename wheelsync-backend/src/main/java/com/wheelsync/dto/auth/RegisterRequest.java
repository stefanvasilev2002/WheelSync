package com.wheelsync.dto.auth;

import com.wheelsync.entity.enums.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class RegisterRequest {

    @NotBlank(message = "First name is required")
    private String firstName;

    @NotBlank(message = "Last name is required")
    private String lastName;

    @NotBlank(message = "Email address is required")
    @Email(message = "Email address is not in a valid format")
    private String email;

    @NotBlank(message = "Password is required")
    @Size(min = 8, message = "Password must contain at least 8 characters")
    private String password;

    private String phone;

    /** Optional role — defaults to DRIVER if not provided */
    private Role role;

    /** Optional company ID for FLEET_MANAGER / DRIVER self-registration */
    private Long companyId;
}
