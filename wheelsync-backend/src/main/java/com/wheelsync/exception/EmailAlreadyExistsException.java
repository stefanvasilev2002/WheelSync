package com.wheelsync.exception;

public class EmailAlreadyExistsException extends RuntimeException {
    public EmailAlreadyExistsException(String email) {
        super("A user with email address '" + email + "' already exists");
    }
}
