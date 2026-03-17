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
        String subject = "WheelSync - Ресетирање на лозинка";
        String body = """
                Здраво,

                Примивме барање за ресетирање на лозинката за вашата WheelSync сметка.

                Кликнете на следниот линк за да ресетирате ја лозинката:
                %s

                Овој линк е важечки 1 час.

                Ако не сте го испратиле ова барање, игнорирајте го овој email.

                WheelSync тим
                """.formatted(resetLink);

        sendEmail(toEmail, subject, body);
    }

    @Async
    public void sendVehicleAssignmentEmail(String toEmail, String driverName, String vehicleDisplay) {
        String subject = "WheelSync - Задолжување на возило";
        String body = """
                Здраво %s,

                Ви беше задолжено возилото: %s

                Можете да пристапите до апликацијата на: %s

                WheelSync тим
                """.formatted(driverName, vehicleDisplay, frontendUrl);

        sendEmail(toEmail, subject, body);
    }

    @Async
    public void sendDefectStatusUpdateEmail(String toEmail, String driverName,
                                             String vehicleDisplay, String defectTitle,
                                             String newStatus) {
        String subject = "WheelSync - Промена на статус на дефект";
        String body = """
                Здраво %s,

                Статусот на вашиот пријавен дефект е ажуриран:

                Возило: %s
                Дефект: %s
                Нов статус: %s

                WheelSync тим
                """.formatted(driverName, vehicleDisplay, defectTitle, newStatus);

        sendEmail(toEmail, subject, body);
    }

    @Async
    public void sendMaintenanceReminderEmail(String toEmail, String managerName,
                                              String vehicleDisplay, String serviceType) {
        String subject = "WheelSync - Потсетник за одржување";
        String body = """
                Здраво %s,

                Се приближува рокот за одржување:

                Возило: %s
                Тип на сервис: %s

                Пристапете до апликацијата за повеќе детали: %s

                WheelSync тим
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
