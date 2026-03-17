package com.wheelsync;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class WheelSyncApplication {

    public static void main(String[] args) {
        SpringApplication.run(WheelSyncApplication.class, args);
    }
}
