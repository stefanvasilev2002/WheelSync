package com.wheelsync.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String fromEmail;

    @Value("${app.frontend-url}")
    private String frontendUrl;

    @Async
    public void sendPasswordResetEmail(String toEmail, String resetToken) {
        String resetLink = frontendUrl + "/auth/reset-password?token=" + resetToken;
        String subject = "WheelSync - Password Reset";
        String body = """
                Hello,

                We received a request to reset the password for your WheelSync account.

                Click the following link to reset your password:
                %s

                This link is valid for 1 hour.

                If you did not submit this request, please ignore this email.

                WheelSync Team
                """.formatted(resetLink);

        sendEmail(toEmail, subject, body);
    }

    @Async
    public void sendVehicleAssignmentEmail(String toEmail, String driverName, String vehicleDisplay) {
        String subject = "WheelSync - Vehicle Assignment";
        String body = """
                Hello %s,

                You have been assigned the vehicle: %s

                You can access the application at: %s

                WheelSync Team
                """.formatted(driverName, vehicleDisplay, frontendUrl);

        sendEmail(toEmail, subject, body);
    }

    @Async
    public void sendDefectStatusUpdateEmail(String toEmail, String driverName,
                                             String vehicleDisplay, String defectTitle,
                                             String newStatus) {
        String subject = "WheelSync - Defect Status Update";
        String body = """
                Hello %s,

                The status of your reported defect has been updated:

                Vehicle: %s
                Defect: %s
                New status: %s

                WheelSync Team
                """.formatted(driverName, vehicleDisplay, defectTitle, newStatus);

        sendEmail(toEmail, subject, body);
    }

    @Async
    public void sendMaintenanceReminderEmail(String toEmail, String managerName,
                                              String vehicleDisplay, String serviceType) {
        String subject = "WheelSync - Maintenance Reminder";
        String body = """
                Hello %s,

                A maintenance deadline is approaching:

                Vehicle: %s
                Service type: %s

                Access the application for more details: %s

                WheelSync Team
                """.formatted(managerName, vehicleDisplay, serviceType, frontendUrl);

        sendEmail(toEmail, subject, body);
    }

    private void sendEmail(String to, String subject, String body) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(to);
            message.setSubject(subject);
            message.setText(body);
            mailSender.send(message);
            log.info("Email sent to: {}", to);
        } catch (Exception e) {
            log.error("Failed to send email to {}: {}", to, e.getMessage());
        }
    }
}
