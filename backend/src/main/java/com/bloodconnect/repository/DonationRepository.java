package com.bloodconnect.repository;

import com.bloodconnect.model.Donation;
import com.bloodconnect.model.BloodRequest;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface DonationRepository extends JpaRepository<Donation, Long> {
    List<Donation> findByDonorId(Long donorId);

    List<Donation> findByHospitalId(Long hospitalId);

    Optional<Donation> findByRequest(BloodRequest request);

    List<Donation> findByRequestId(Long requestId);
}
