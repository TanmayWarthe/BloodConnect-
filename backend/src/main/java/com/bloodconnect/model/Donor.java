package com.bloodconnect.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import com.fasterxml.jackson.annotation.JsonIgnore;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "donors")
@Data
@NoArgsConstructor
public class Donor {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "user_id", referencedColumnName = "id")
    private User user;

    private String name;
    private String bloodGroup; // A+, B-, etc.
    private String rhFactor; // Positive, Negative
    private LocalDate dob;
    private String gender;
    private String phone;
    private String address;

    // For Location (Latitude/Longitude)
    private Double latitude;
    private Double longitude;

    private LocalDate lastDonationDate;

    @Enumerated(EnumType.STRING)
    private AvailabilityStatus availabilityStatus = AvailabilityStatus.AVAILABLE;

    @OneToMany(mappedBy = "donor", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonIgnore // Prevent circular reference in JSON serialization
    private List<Donation> donations = new ArrayList<>();

    public enum AvailabilityStatus {
        AVAILABLE, BUSY, UNAVAILABLE
    }
}
