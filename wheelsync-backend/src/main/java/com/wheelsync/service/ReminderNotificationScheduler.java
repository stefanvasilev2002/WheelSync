package com.wheelsync.service;

import com.wheelsync.entity.MaintenanceReminder;
import com.wheelsync.entity.User;
import com.wheelsync.entity.enums.Role;
import com.wheelsync.repository.MaintenanceReminderRepository;
import com.wheelsync.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class ReminderNotificationScheduler {

    private final MaintenanceReminderRepository reminderRepository;
    private final UserRepository userRepository;
    private final EmailService emailService;

    /**
     * FR-9.4 — Run every day at 08:00 and send email notifications to Fleet Managers
     * for any maintenance reminder that is due within its warning threshold.
     */
    @Scheduled(cron = "0 * * * * *")
    @Transactional(readOnly = true)
    public void sendDueReminderEmails() {
        // Fetch all active reminders whose due date falls within the next 30 days
        // (the service-level isDueSoon() check provides the real threshold per reminder)
        LocalDate checkDate = LocalDate.now().plusDays(30);
        List<MaintenanceReminder> candidates = reminderRepository.findAllDueSoon(checkDate);

        for (MaintenanceReminder reminder : candidates) {
            if (!isDueSoon(reminder)) {
                continue;
            }

            Long companyId = reminder.getVehicle().getCompany() != null
                    ? reminder.getVehicle().getCompany().getId()
                    : null;
            if (companyId == null) continue;

            // Notify all active Fleet Managers of this company
            List<User> managers = userRepository.findByCompanyIdAndRole(companyId, Role.FLEET_MANAGER);
            for (User manager : managers) {
                if (Boolean.TRUE.equals(manager.getIsActive())) {
                    emailService.sendMaintenanceReminderEmail(
                            manager.getEmail(),
                            manager.getFullName(),
                            reminder.getVehicle().getDisplayName(),
                            reminder.getServiceType().name()
                    );
                }
            }
        }

        log.info("Reminder notification job completed: {} due reminders checked", candidates.size());
    }

    private boolean isDueSoon(MaintenanceReminder r) {
        boolean dueSoonByDate = false;
        boolean dueSoonByMileage = false;

        if (r.getNextDueDate() != null && r.getWarningThresholdDays() != null) {
            LocalDate threshold = LocalDate.now().plusDays(r.getWarningThresholdDays());
            dueSoonByDate = !r.getNextDueDate().isAfter(threshold);
        }

        if (r.getNextDueMileage() != null && r.getWarningThresholdKm() != null) {
            int currentMileage = r.getVehicle().getCurrentMileage();
            dueSoonByMileage = (r.getNextDueMileage() - currentMileage) <= r.getWarningThresholdKm();
        }

        return dueSoonByDate || dueSoonByMileage;
    }
}
