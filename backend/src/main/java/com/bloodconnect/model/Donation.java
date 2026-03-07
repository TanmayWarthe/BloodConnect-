package com.bloodconnect.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "donations")
@Data
@NoArgsConstructor
public class Donation {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "donor_id")
    private Donor donor;

    @ManyToOne
    @JoinColumn(name = "hospital_id")
    private Hospital hospital;

    @ManyToOne
    @JoinColumn(name = "request_id")
    private BloodRequest request;

    @OneToOne
    @JoinColumn(name = "appointment_id")
    private Appointment appointment;

    private String bloodGroup;
    private Integer units;

    @Enumerated(EnumType.STRING)
    private DonationType donationType; // DIRECT_TO_PATIENT, TO_HOSPITAL

    @Enumerated(EnumType.STRING)
    private DonationStatus status = DonationStatus.PENDING;

    @CreationTimestamp
    private LocalDateTime donationDate;

    private LocalDateTime completedDate;

    public enum DonationType {
        DIRECT_TO_PATIENT, // Donor directly fulfills patient request
        TO_HOSPITAL // Hospital fulfills patient request from inventory
    }

    public enum DonationStatus {
        PENDING, SCHEDULED, COMPLETED, CANCELLED
    }
}
