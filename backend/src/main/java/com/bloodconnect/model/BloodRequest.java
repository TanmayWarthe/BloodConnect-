package com.bloodconnect.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "blood_requests")
@Data
@NoArgsConstructor
public class BloodRequest {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "requester_user_id") // Links to User causing request (Patient/Hospital)
    private User requester;

    @ManyToOne
    @JoinColumn(name = "patient_id") // Links to actual patient entity
    private Patient patient;

    private String patientName; // If requested by hospital for a specific patient
    private String bloodGroup;
    private Integer unitsRequired;

    @Enumerated(EnumType.STRING)
    private Urgency urgency; // NORMAL, URGENT, EMERGENCY

    private String hospitalName; // Where blood is needed
    private Double latitude;
    private Double longitude;

    @Enumerated(EnumType.STRING)
    private RequestStatus status = RequestStatus.PENDING;

    @CreationTimestamp
    private LocalDateTime createdAt;

    public enum Urgency {
        NORMAL, URGENT, CRITICAL, EMERGENCY
    }

    public enum RequestStatus {
        PENDING, MATCHED, ACCEPTED, FULFILLED, CANCELLED
    }
}
