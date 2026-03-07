package com.bloodconnect.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "notifications")
@Data
@NoArgsConstructor
public class Notification {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "recipient_user_id", nullable = false)
    private User recipient;

    @Column(nullable = false, length = 50)
    private String type; // REQUEST_CREATED, REQUEST_ACCEPTED, REQUEST_FULFILLED, REQUEST_CANCELLED

    @Column(nullable = false, columnDefinition = "TEXT")
    private String message;

    @Column(name = "related_request_id")
    private Long relatedRequestId;

    @Column(name = "is_read", nullable = false)
    private Boolean isRead = false;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    // Constructor for easy creation
    public Notification(User recipient, String type, String message, Long relatedRequestId) {
        this.recipient = recipient;
        this.type = type;
        this.message = message;
        this.relatedRequestId = relatedRequestId;
        this.isRead = false;
    }
}
