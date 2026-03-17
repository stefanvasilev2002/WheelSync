package com.wheelsync.dto.auth;

import com.wheelsync.entity.enums.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class RegisterRequest {

    @NotBlank(message = "Името е задолжително")
    private String firstName;

    @NotBlank(message = "Презимето е задолжително")
    private String lastName;

    @NotBlank(message = "Email адресата е задолжителна")
    @Email(message = "Email адресата не е во валиден формат")
    private String email;

    @NotBlank(message = "Лозинката е задолжителна")
    @Size(min = 8, message = "Лозинката мора да содржи минимум 8 карактери")
    private String password;

    private String phone;

    /** Optional role — defaults to DRIVER if not provided */
    private Role role;

    /** Optional company ID for FLEET_MANAGER / DRIVER self-registration */
    private Long companyId;
}
