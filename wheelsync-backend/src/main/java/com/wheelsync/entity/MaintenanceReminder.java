package com.wheelsync.entity;

import com.wheelsync.entity.enums.IntervalType;
import com.wheelsync.entity.enums.ServiceType;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "maintenance_reminder")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MaintenanceReminder {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vehicle_id", nullable = false)
    private Vehicle vehicle;

    @Enumerated(EnumType.STRING)
    @Column(name = "service_type", nullable = false)
    private ServiceType serviceType;

    @Enumerated(EnumType.STRING)
    @Column(name = "interval_type", nullable = false)
    private IntervalType intervalType;

    @Column(name = "mileage_interval")
    private Integer mileageInterval;

    @Column(name = "date_interval_months")
    private Integer dateIntervalMonths;

    @Column(name = "last_service_date")
    private LocalDate lastServiceDate;

    @Column(name = "last_service_mileage")
    private Integer lastServiceMileage;

    @Column(name = "next_due_date")
    private LocalDate nextDueDate;

    @Column(name = "next_due_mileage")
    private Integer nextDueMileage;

    @Column(name = "warning_threshold_km")
    @Builder.Default
    private Integer warningThresholdKm = 1000;

    @Column(name = "warning_threshold_days")
    @Builder.Default
    private Integer warningThresholdDays = 14;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private Boolean isActive = true;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
