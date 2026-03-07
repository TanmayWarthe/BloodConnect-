package com.bloodconnect.repository;

import com.bloodconnect.model.Inventory;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface InventoryRepository extends JpaRepository<Inventory, Long> {
    List<Inventory> findByHospitalId(Long hospitalId);
    Optional<Inventory> findByHospitalIdAndBloodGroup(Long hospitalId, String bloodGroup);
}
