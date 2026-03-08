package com.bloodconnect.service;

import com.bloodconnect.model.User;
import com.bloodconnect.repository.UserRepository;
import com.bloodconnect.util.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Objects;
import java.util.Optional;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JwtUtil jwtUtil;

    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    /**
     * Register a new user with MySQL + JWT authentication.
     * Persists the user, then stores the auto-generated DB id as the string UID
     * used for all downstream lookups.
     */
    @Transactional
    public User register(String name, String email, String rawPassword, User.Role role) {
        if (userRepository.findByEmail(email).isPresent()) {
            throw new RuntimeException("Email already in use");
        }

        User user = new User();
        user.setName(name);
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode(rawPassword));
        user.setRole(role);

        // Save — Hibernate assigns the auto-increment primary key immediately
        return userRepository.save(user);
    }

    /**
     * Verify credentials and return a signed JWT, or throw if invalid.
     */
    public String login(String email, String rawPassword) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("No account found with this email"));

        if (!passwordEncoder.matches(rawPassword, user.getPassword())) {
            throw new RuntimeException("Incorrect password");
        }

        String uid = String.valueOf(Objects.requireNonNull(user.getId(), "User ID must not be null"));
        return jwtUtil.generateToken(uid, user.getEmail(), user.getRole().name().toLowerCase());
    }

    public Optional<User> findByEmail(String email) {
        return userRepository.findByEmail(email);
    }

    public Optional<User> findById(Long id) {
        return userRepository.findById(id);
    }

    /** Look up a user by their string UID (the MySQL id serialised as a String). */
    public Optional<User> findByUid(String uid) {
        return userRepository.findByUid(uid);
    }
}