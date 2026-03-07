package com.bloodconnect.controller;

import com.bloodconnect.model.User;
import com.bloodconnect.service.UserService;
import lombok.Data;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "*")
public class UserController {

    @Autowired
    private UserService userService;

    /**
     * Sync Firebase user with backend database.
     * Creates the user if not present, returns existing user otherwise.
     */
    @PostMapping("/sync")
    public ResponseEntity<User> syncUser(@RequestBody UserSyncRequest request) {
        User user = userService.syncUser(request.getFirebaseUid(), request.getEmail(), request.getRole());
        return ResponseEntity.ok(user);
    }

    /** Retrieve a user record by Firebase UID */
    @GetMapping("/{uid}")
    public ResponseEntity<User> getUser(@PathVariable String uid) {
        return userService.findByFirebaseUid(uid)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /** Get only the role and email for a user (used on login to route to correct dashboard) */
    @GetMapping("/{uid}/role")
    public ResponseEntity<?> getUserRole(@PathVariable String uid) {
        return userService.findByFirebaseUid(uid)
                .map(user -> {
                    Map<String, String> response = new HashMap<>();
                    response.put("role", user.getRole().name().toLowerCase());
                    response.put("email", user.getEmail());
                    return ResponseEntity.ok(response);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    /** DTO for user sync request — Lombok @Data generates getters/setters automatically */
    @Data
    public static class UserSyncRequest {
        private String firebaseUid;
        private String email;
        private User.Role role;
    }
}
