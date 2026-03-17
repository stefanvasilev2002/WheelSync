package com.wheelsync.dto.auth;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ResetPasswordRequest {

    @NotBlank(message = "Токенот е задолжителен")
    private String token;

    @NotBlank(message = "Лозинката е задолжителна")
    @Size(min = 8, message = "Лозинката мора да содржи минимум 8 карактери")
    private String newPassword;
}
