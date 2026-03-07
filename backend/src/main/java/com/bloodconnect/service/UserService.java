package com.bloodconnect.service;

import com.bloodconnect.model.User;
import com.bloodconnect.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class UserService {
    @Autowired
    private UserRepository userRepository;

    public User syncUser(String firebaseUid, String email, User.Role role) {
        Optional<User> existing = userRepository.findByFirebaseUid(firebaseUid);
        if (existing.isPresent()) {
            return existing.get();
        }
        
        User newUser = new User();
        newUser.setFirebaseUid(firebaseUid);
        newUser.setEmail(email);
        newUser.setRole(role);
        return userRepository.save(newUser);
    }
    
    public Optional<User> findByFirebaseUid(String uid) {
        return userRepository.findByFirebaseUid(uid);
    }
}
