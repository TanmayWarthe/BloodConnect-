package com.bloodconnect.repository;

import com.bloodconnect.model.Donor;
import com.bloodconnect.model.Donor.AvailabilityStatus;
import com.bloodconnect.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface DonorRepository extends JpaRepository<Donor, Long> {
    Optional<Donor> findByUser(User user);

    List<Donor> findByBloodGroup(String bloodGroup);

    List<Donor> findByBloodGroupAndAvailabilityStatus(String bloodGroup, AvailabilityStatus status);
}
