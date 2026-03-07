package com.bloodconnect.repository;

import com.bloodconnect.model.Patient;
import com.bloodconnect.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface PatientRepository extends JpaRepository<Patient, Long> {
    Optional<Patient> findByUserId(Long userId);

    Optional<Patient> findByUser(User user);
}
