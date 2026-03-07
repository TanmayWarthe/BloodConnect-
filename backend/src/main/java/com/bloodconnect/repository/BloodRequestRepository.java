package com.bloodconnect.repository;

import com.bloodconnect.model.BloodRequest;
import com.bloodconnect.model.BloodRequest.RequestStatus;
import com.bloodconnect.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface BloodRequestRepository extends JpaRepository<BloodRequest, Long> {
    List<BloodRequest> findByStatus(RequestStatus status);

    List<BloodRequest> findByRequesterId(Long requesterId);

    List<BloodRequest> findByRequester(User requester);
}
