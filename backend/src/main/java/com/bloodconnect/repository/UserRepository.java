package com.bloodconnect.repository;

import com.bloodconnect.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);

    /**
     * Look up user by "uid" — the uid used throughout the app
     * is the MySQL user id serialised as a String.
     */
    default Optional<User> findByUid(String uid) {
        try {
            return findById(Long.parseLong(uid));
        } catch (NumberFormatException e) {
            return Optional.empty();
        }
    }
}
