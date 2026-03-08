package com.bloodconnect.controller;

import com.bloodconnect.model.User;
import com.bloodconnect.repository.UserRepository;
import com.bloodconnect.service.UserService;
import com.bloodconnect.util.JwtUtil;
import lombok.Data;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class UserController {

    @Autowired
    private UserService userService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JwtUtil jwtUtil;

    // ----------------------------------------------------------------
    // Auth endpoints
    // ----------------------------------------------------------------

    @PostMapping("/auth/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest req) {
        try {
            User.Role role = User.Role.valueOf(req.getRole().toUpperCase());
            User user = userService.register(req.getName(), req.getEmail(), req.getPassword(), role);

            String token = jwtUtil.generateToken(
                    String.valueOf(user.getId()),
                    user.getEmail(),
                    user.getRole().name().toLowerCase()
            );

            Map<String, Object> body = new HashMap<>();
            body.put("token", token);
            body.put("uid", String.valueOf(user.getId()));
            body.put("email", user.getEmail());
            body.put("name", user.getName());
            body.put("role", user.getRole().name().toLowerCase());
            return ResponseEntity.ok(body);
        } catch (RuntimeException ex) {
            Map<String, String> error = new HashMap<>();
            error.put("message", ex.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
        }
    }

    @PostMapping("/auth/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest req) {
        try {
            String token = userService.login(req.getEmail(), req.getPassword());

            User user = userService.findByEmail(req.getEmail()).orElseThrow();

            Map<String, Object> body = new HashMap<>();
            body.put("token", token);
            body.put("uid", String.valueOf(user.getId()));
            body.put("email", user.getEmail());
            body.put("name", user.getName());
            body.put("role", user.getRole().name().toLowerCase());
            return ResponseEntity.ok(body);
        } catch (RuntimeException ex) {
            Map<String, String> error = new HashMap<>();
            error.put("message", ex.getMessage());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(error);
        }
    }

    // ----------------------------------------------------------------
    // User info endpoints (uid = MySQL user id as String)
    // ----------------------------------------------------------------

    @GetMapping("/users/{uid}")
    public ResponseEntity<User> getUser(@PathVariable String uid) {
        return userRepository.findByUid(uid)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/users/{uid}/role")
    public ResponseEntity<?> getUserRole(@PathVariable String uid) {
        return userRepository.findByUid(uid)
                .map(user -> {
                    Map<String, String> response = new HashMap<>();
                    response.put("role", user.getRole().name().toLowerCase());
                    response.put("email", user.getEmail());
                    return ResponseEntity.ok(response);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    // ----------------------------------------------------------------
    // DTOs
    // ----------------------------------------------------------------

    @Data
    public static class LoginRequest {
        private String email;
        private String password;
    }

    @Data
    public static class RegisterRequest {
        private String name;
        private String email;
        private String password;
        private String role;
    }
}
