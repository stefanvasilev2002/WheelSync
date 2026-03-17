package com.wheelsync.dto.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ForgotPasswordRequest {

    @NotBlank(message = "Email адресата е задолжителна")
    @Email(message = "Email адресата не е во валиден формат")
    private String email;
}
