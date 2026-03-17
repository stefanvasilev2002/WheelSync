package com.wheelsync.exception;

public class EmailAlreadyExistsException extends RuntimeException {
    public EmailAlreadyExistsException(String email) {
        super("Корисник со email адреса '" + email + "' веќе постои");
    }
}
