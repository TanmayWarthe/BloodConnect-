package com.bloodconnect.controller;

import com.bloodconnect.model.Notification;
import com.bloodconnect.service.NotificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
@CrossOrigin(origins = "*")
public class NotificationController {

    @Autowired
    private NotificationService notificationService;

    /**
     * Get all notifications for a user
     */
    @GetMapping("/{uid}")
    public ResponseEntity<List<Notification>> getAllNotifications(@PathVariable("uid") String uid) {
        List<Notification> notifications = notificationService.getAllNotifications(uid);
        return ResponseEntity.ok(notifications);
    }

    /**
     * Get unread notifications for a user
     */
    @GetMapping("/{uid}/unread")
    public ResponseEntity<List<Notification>> getUnreadNotifications(@PathVariable("uid") String uid) {
        List<Notification> notifications = notificationService.getUnreadNotifications(uid);
        return ResponseEntity.ok(notifications);
    }

    /**
     * Get unread notification count
     */
    @GetMapping("/{uid}/count")
    public ResponseEntity<Map<String, Long>> getUnreadCount(@PathVariable("uid") String uid) {
        Long count = notificationService.getUnreadCount(uid);
        Map<String, Long> response = new HashMap<>();
        response.put("count", count);
        return ResponseEntity.ok(response);
    }

    /**
     * Mark a notification as read
     */
    @PutMapping("/{id}/read")
    public ResponseEntity<Notification> markAsRead(@PathVariable("id") Long id) {
        Notification notification = notificationService.markAsRead(id);
        return ResponseEntity.ok(notification);
    }

    /**
     * Mark all notifications as read for a user
     */
    @PutMapping("/{uid}/read-all")
    public ResponseEntity<Map<String, String>> markAllAsRead(@PathVariable("uid") String uid) {
        notificationService.markAllAsRead(uid);
        Map<String, String> response = new HashMap<>();
        response.put("message", "All notifications marked as read");
        return ResponseEntity.ok(response);
    }
}
