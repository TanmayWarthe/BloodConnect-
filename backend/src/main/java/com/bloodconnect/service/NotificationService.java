package com.bloodconnect.service;

import com.bloodconnect.model.Notification;
import com.bloodconnect.model.User;
import com.bloodconnect.repository.NotificationRepository;
import com.bloodconnect.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class NotificationService {

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private UserRepository userRepository;

    /** Create a new notification for a user */
    @Transactional
    public Notification createNotification(User recipient, String type, String message, Long relatedRequestId) {
        Notification notification = new Notification(recipient, type, message, relatedRequestId);
        return notificationRepository.save(notification);
    }

    /** Get all notifications for a user by UID */
    public List<Notification> getAllNotifications(String uid) {
        User user = userRepository.findByUid(uid)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return notificationRepository.findByRecipientOrderByCreatedAtDesc(user);
    }

    /** Get unread notifications for a user */
    public List<Notification> getUnreadNotifications(String uid) {
        User user = userRepository.findByUid(uid)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return notificationRepository.findByRecipientAndIsReadOrderByCreatedAtDesc(user, false);
    }

    /**
     * Get unread notification count.
     * FIX: countBy returns a boxed Long which Spring Data annotates @NonNull,
     * but can theoretically be null in edge cases. We default to 0L safely.
     */
    public long getUnreadCount(String uid) {
        User user = userRepository.findByUid(uid)
                .orElseThrow(() -> new RuntimeException("User not found"));
        Long count = notificationRepository.countByRecipientAndIsRead(user, false);
        // FIX: return primitive long — avoids @NonNull Long warning and NPE risk
        return count != null ? count : 0L;
    }

    /** Mark a notification as read */
    @Transactional
    public Notification markAsRead(Long notificationId) {
        @SuppressWarnings("null")
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new RuntimeException("Notification not found"));
        notification.setIsRead(true);
        return notificationRepository.save(notification);
    }

    /**
     * Mark all notifications as read for a user (batch update for efficiency)
     */
    @Transactional
    public void markAllAsRead(String uid) {
        User user = userRepository.findByUid(uid)
                .orElseThrow(() -> new RuntimeException("User not found"));

        List<Notification> unread = notificationRepository
                .findByRecipientAndIsReadOrderByCreatedAtDesc(user, false);

        unread.forEach(n -> n.setIsRead(true));
        notificationRepository.saveAll(unread);
    }
}