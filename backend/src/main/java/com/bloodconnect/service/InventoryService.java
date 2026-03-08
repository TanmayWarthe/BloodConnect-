package com.bloodconnect.service;

import com.bloodconnect.model.Hospital;
import com.bloodconnect.model.Inventory;
import com.bloodconnect.model.User;
import com.bloodconnect.exception.InsufficientInventoryException;
import com.bloodconnect.repository.HospitalRepository;
import com.bloodconnect.repository.InventoryRepository;
import com.bloodconnect.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Objects;
import java.util.Optional;

@Service
public class InventoryService {

    @Autowired
    private InventoryRepository inventoryRepository;

    @Autowired
    private HospitalRepository hospitalRepository;

    @Autowired
    private UserRepository userRepository;

    /**
     * Validate that hospital has sufficient inventory before deduction
     */
    public void validateInventory(String uid, String bloodGroup, int requiredUnits) {
        User user = userRepository.findByUid(uid)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Hospital hospital = hospitalRepository.findByUser(user)
                .orElseThrow(() -> new RuntimeException("Hospital profile not found"));

        // FIX: null-safe unbox — hospital is guaranteed non-null by orElseThrow above
        Optional<Inventory> inventory = inventoryRepository
                .findByHospitalIdAndBloodGroup(
                        Objects.requireNonNull(hospital.getId(), "Hospital ID must not be null"),
                        bloodGroup);

        int available = inventory.map(Inventory::getUnitsAvailable).orElse(0);

        if (available < requiredUnits) {
            throw new InsufficientInventoryException(
                    "Insufficient inventory for blood group " + bloodGroup
                            + ". Required: " + requiredUnits + ", Available: " + available);
        }
    }

    public Inventory updateInventory(String uid, String bloodGroup, int units) {
        User user = userRepository.findByUid(uid)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Hospital hospital = hospitalRepository.findByUser(user)
                .orElseThrow(() -> new RuntimeException("Hospital profile not found"));

        // FIX: null-safe unbox
        Long hospitalId = Objects.requireNonNull(hospital.getId(), "Hospital ID must not be null");

        Optional<Inventory> existing = inventoryRepository
                .findByHospitalIdAndBloodGroup(hospitalId, bloodGroup);

        Inventory inv;
        if (existing.isPresent()) {
            inv = existing.get();
            int newQuantity = inv.getUnitsAvailable() + units;
            if (newQuantity < 0) {
                throw new RuntimeException("Insufficient inventory. Available: " + inv.getUnitsAvailable()
                        + ", Requested: " + Math.abs(units));
            }
            inv.setUnitsAvailable(newQuantity);
        } else {
            if (units < 0) {
                throw new RuntimeException("Cannot deduct from non-existent inventory");
            }
            inv = new Inventory();
            inv.setHospital(hospital);
            inv.setBloodGroup(bloodGroup);
            inv.setUnitsAvailable(units);
        }

        return inventoryRepository.save(inv);
    }

    public List<Inventory> getInventoryByHospital(String uid) {
        User user = userRepository.findByUid(uid)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Hospital hospital = hospitalRepository.findByUser(user)
                .orElseThrow(() -> new RuntimeException("Hospital profile not found"));

        // FIX: null-safe unbox
        return inventoryRepository.findByHospitalId(
                Objects.requireNonNull(hospital.getId(), "Hospital ID must not be null"));
    }

    public Inventory addInventory(String uid, String bloodGroup, int units) {
        return updateInventory(uid, bloodGroup, units);
    }
}