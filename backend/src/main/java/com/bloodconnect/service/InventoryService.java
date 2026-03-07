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
    public void validateInventory(String firebaseUid, String bloodGroup, int requiredUnits) {
        User user = userRepository.findByFirebaseUid(firebaseUid)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Hospital hospital = hospitalRepository.findByUser(user)
                .orElseThrow(() -> new RuntimeException("Hospital profile not found"));

        Optional<Inventory> inventory = inventoryRepository
                .findByHospitalIdAndBloodGroup(hospital.getId(), bloodGroup);

        int available = inventory.map(Inventory::getUnitsAvailable).orElse(0);

        if (available < requiredUnits) {
            throw new InsufficientInventoryException(
                    "Insufficient inventory for blood group " + bloodGroup +
                            ". Required: " + requiredUnits + ", Available: " + available);
        }
    }

    public Inventory updateInventory(String firebaseUid, String bloodGroup, int units) {
        User user = userRepository.findByFirebaseUid(firebaseUid)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Hospital hospital = hospitalRepository.findByUser(user)
                .orElseThrow(() -> new RuntimeException("Hospital profile not found"));

        Optional<Inventory> existing = inventoryRepository.findByHospitalIdAndBloodGroup(hospital.getId(), bloodGroup);
        Inventory inv;
        if (existing.isPresent()) {
            inv = existing.get();
            // Add units (can be negative for deduction)
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

    public List<Inventory> getInventoryByHospital(String firebaseUid) {
        User user = userRepository.findByFirebaseUid(firebaseUid)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Hospital hospital = hospitalRepository.findByUser(user)
                .orElseThrow(() -> new RuntimeException("Hospital profile not found"));

        return inventoryRepository.findByHospitalId(hospital.getId());
    }

    public Inventory addInventory(String firebaseUid, String bloodGroup, int units) {
        return updateInventory(firebaseUid, bloodGroup, units);
    }
}
