package com.wheelsync.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
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

    // -------------------------------------------------------------------------
    // Public methods
    // -------------------------------------------------------------------------

    @Async
    public void sendPasswordResetEmail(String toEmail, String resetToken) {
        String resetLink = frontendUrl + "/auth/reset-password?token=" + resetToken;
        String subject = "WheelSync — Password Reset";
        String html = baseTemplate("Password Reset",
                """
                <p>We received a request to reset the password for your WheelSync account.</p>
                <p>Click the button below to choose a new password:</p>
                """ +
                actionButton(resetLink, "Reset Password") +
                """
                <p style="color:#6b7280;font-size:13px;margin-top:24px;">
                  This link is valid for <strong>1 hour</strong>. If you didn't request a
                  password reset, you can safely ignore this email.
                </p>
                """);
        sendHtml(toEmail, subject, html);
    }

    @Async
    public void sendVehicleAssignmentEmail(String toEmail, String driverName, String vehicleDisplay) {
        String subject = "WheelSync — New Vehicle Assignment";
        String html = baseTemplate("Vehicle Assignment",
                """
                <p>Hello <strong>%s</strong>,</p>
                <p>You have been assigned a vehicle in the WheelSync fleet management system.</p>
                """.formatted(driverName) +
                infoBox("🚛", "Assigned Vehicle", vehicleDisplay) +
                actionButton(frontendUrl, "Open WheelSync") +
                footer("Log in to view your assignment details and upcoming schedule."));
        sendHtml(toEmail, subject, html);
    }

    @Async
    public void sendDefectStatusUpdateEmail(String toEmail, String driverName,
                                             String vehicleDisplay, String defectTitle,
                                             String newStatus) {
        String subject = "WheelSync — Defect Status Updated";
        String statusColor = switch (newStatus.toUpperCase()) {
            case "RESOLVED"    -> "#16a34a";
            case "IN_PROGRESS" -> "#d97706";
            default            -> "#6b7280";
        };
        String html = baseTemplate("Defect Status Update",
                """
                <p>Hello <strong>%s</strong>,</p>
                <p>The status of your reported defect has been updated.</p>
                """.formatted(driverName) +
                """
                <table style="width:100%%;border-collapse:collapse;margin:20px 0;">
                  <tr><td style="padding:10px;background:#f9fafb;border:1px solid #e5e7eb;font-weight:600;width:140px;">Vehicle</td>
                      <td style="padding:10px;border:1px solid #e5e7eb;">%s</td></tr>
                  <tr><td style="padding:10px;background:#f9fafb;border:1px solid #e5e7eb;font-weight:600;">Defect</td>
                      <td style="padding:10px;border:1px solid #e5e7eb;">%s</td></tr>
                  <tr><td style="padding:10px;background:#f9fafb;border:1px solid #e5e7eb;font-weight:600;">New Status</td>
                      <td style="padding:10px;border:1px solid #e5e7eb;">
                        <span style="color:%s;font-weight:700;">%s</span></td></tr>
                </table>
                """.formatted(vehicleDisplay, defectTitle, statusColor, newStatus) +
                actionButton(frontendUrl, "View in WheelSync") +
                footer("You can track all defects from the Defects section in the app."));
        sendHtml(toEmail, subject, html);
    }

    @Async
    public void sendMaintenanceReminderEmail(String toEmail, String managerName,
                                              String vehicleDisplay, String serviceType) {
        String friendlyService = serviceType.replace("_", " ");
        String subject = "WheelSync — Maintenance Due: " + friendlyService;
        String html = baseTemplate("Maintenance Reminder",
                """
                <p>Hello <strong>%s</strong>,</p>
                <p>A maintenance deadline is approaching for one of your fleet vehicles.
                   Please schedule the service as soon as possible.</p>
                """.formatted(managerName) +
                """
                <div style="background:#fff7ed;border-left:4px solid #f97316;
                            padding:16px 20px;margin:20px 0;border-radius:0 8px 8px 0;">
                  <p style="margin:0 0 8px;font-size:13px;color:#9a3412;font-weight:600;
                             text-transform:uppercase;letter-spacing:.05em;">Action Required</p>
                  <p style="margin:0 0 4px;font-size:15px;"><strong>Vehicle:</strong> %s</p>
                  <p style="margin:0;font-size:15px;"><strong>Service:</strong> %s</p>
                </div>
                """.formatted(vehicleDisplay, friendlyService) +
                actionButton(frontendUrl + "/reminders", "View All Reminders") +
                footer("This notification was sent because a maintenance reminder threshold was reached."));
        sendHtml(toEmail, subject, html);
    }

    // -------------------------------------------------------------------------
    // HTML template helpers
    // -------------------------------------------------------------------------

    private String baseTemplate(String title, String content) {
        return """
            <!DOCTYPE html>
            <html lang="en">
            <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
            <body style="margin:0;padding:0;background:#f3f4f6;font-family:'Segoe UI',Arial,sans-serif;">
              <table width="100%%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:40px 0;">
                <tr><td align="center">
                  <table width="600" cellpadding="0" cellspacing="0"
                         style="background:#ffffff;border-radius:12px;overflow:hidden;
                                box-shadow:0 2px 8px rgba(0,0,0,.08);max-width:600px;width:100%%;">

                    <!-- Header -->
                    <tr>
                      <td style="background:linear-gradient(135deg,#1d4ed8,#2563eb);
                                 padding:32px 40px;text-align:center;">
                        <h1 style="margin:0;color:#ffffff;font-size:26px;font-weight:700;
                                   letter-spacing:-.5px;">🚗 WheelSync</h1>
                        <p style="margin:6px 0 0;color:#bfdbfe;font-size:14px;">Fleet Management System</p>
                      </td>
                    </tr>

                    <!-- Title bar -->
                    <tr>
                      <td style="background:#eff6ff;padding:16px 40px;border-bottom:1px solid #dbeafe;">
                        <h2 style="margin:0;color:#1e40af;font-size:18px;font-weight:600;">%s</h2>
                      </td>
                    </tr>

                    <!-- Body -->
                    <tr>
                      <td style="padding:32px 40px;color:#374151;font-size:15px;line-height:1.6;">
                        %s
                      </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                      <td style="background:#f9fafb;padding:20px 40px;border-top:1px solid #e5e7eb;
                                 text-align:center;color:#9ca3af;font-size:12px;">
                        &copy; 2026 WheelSync &nbsp;|&nbsp; This is an automated message, please do not reply.
                      </td>
                    </tr>

                  </table>
                </td></tr>
              </table>
            </body>
            </html>
            """.formatted(title, content);
    }

    private String actionButton(String url, String label) {
        return """
            <div style="text-align:center;margin:28px 0;">
              <a href="%s"
                 style="background:#2563eb;color:#ffffff;text-decoration:none;
                        padding:13px 32px;border-radius:8px;font-size:15px;
                        font-weight:600;display:inline-block;">%s</a>
            </div>
            """.formatted(url, label);
    }

    private String infoBox(String icon, String label, String value) {
        return """
            <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;
                        padding:16px 20px;margin:20px 0;display:flex;align-items:center;">
              <span style="font-size:28px;margin-right:14px;">%s</span>
              <div>
                <p style="margin:0;font-size:12px;color:#6b7280;text-transform:uppercase;
                           letter-spacing:.06em;font-weight:600;">%s</p>
                <p style="margin:4px 0 0;font-size:16px;font-weight:700;color:#1e3a8a;">%s</p>
              </div>
            </div>
            """.formatted(icon, label, value);
    }

    private String footer(String note) {
        return """
            <p style="color:#9ca3af;font-size:13px;margin-top:24px;padding-top:16px;
                      border-top:1px solid #f3f4f6;">%s</p>
            """.formatted(note);
    }

    // -------------------------------------------------------------------------
    // Send
    // -------------------------------------------------------------------------

    private void sendHtml(String to, String subject, String html) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(fromEmail);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(html, true);
            mailSender.send(message);
            log.info("Email sent to: {}", to);
        } catch (MessagingException e) {
            log.error("Failed to send email to {}: {}", to, e.getMessage());
        }
    }
}
