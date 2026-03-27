package com.wheelsync.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

@Configuration
public class FileStorageConfig {

    @Value("${app.file.upload-dir:./uploads}")
    private String uploadDir;

    @Bean
    public Path fileStorageLocation() {
        // Resolve relative paths against the user home so they are always writable on any OS
        Path path = Paths.get(uploadDir);
        if (!path.isAbsolute()) {
            path = Paths.get(System.getProperty("user.home"), uploadDir).normalize();
        } else {
            path = path.normalize();
        }
        try {
            Files.createDirectories(path);
        } catch (Exception e) {
            throw new RuntimeException("Could not create upload directory at " + path + ": " + e.getMessage(), e);
        }
        return path;
    }
}
