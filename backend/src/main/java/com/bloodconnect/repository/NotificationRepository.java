package com.bloodconnect.repository;

import com.bloodconnect.model.Notification;
import com.bloodconnect.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {

    // Find all notifications for a user, ordered by newest first
    List<Notification> findByRecipientOrderByCreatedAtDesc(User recipient);

    // Find unread notifications for a user
    List<Notification> findByRecipientAndIsReadOrderByCreatedAtDesc(User recipient, Boolean isRead);

    // Count unread notifications for a user
    Long countByRecipientAndIsRead(User recipient, Boolean isRead);

    // Find notifications by type for a user
    List<Notification> findByRecipientAndTypeOrderByCreatedAtDesc(User recipient, String type);
}
