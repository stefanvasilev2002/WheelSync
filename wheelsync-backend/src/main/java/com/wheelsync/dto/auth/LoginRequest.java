package com.wheelsync.dto.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class LoginRequest {

    @NotBlank(message = "Email address is required")
    @Email(message = "Email address is not in a valid format")
    private String email;

    @NotBlank(message = "Password is required")
    private String password;
}
