package com.bloodconnect.controller;

import com.bloodconnect.model.Inventory;
import com.bloodconnect.service.InventoryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/inventory")
@CrossOrigin(origins = "*")
public class InventoryController {

    @Autowired
    private InventoryService inventoryService;

    /** Get full inventory list for a hospital */
    @GetMapping("/hospital/{uid}")
    public ResponseEntity<?> getHospitalInventory(@PathVariable String uid) {
        try {
            List<Inventory> inventory = inventoryService.getInventoryByHospital(uid);
            return ResponseEntity.ok(inventory);
        } catch (RuntimeException e) {
            Map<String, String> error = new HashMap<>();
            error.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    /**
     * Update inventory for a blood group.
     * operation param: ADD (default) or REMOVE.
     * For REMOVE, units will be deducted; negative counts are rejected.
     */
    @PostMapping("/hospital/{uid}/update")
    public ResponseEntity<?> updateInventory(
            @PathVariable String uid,
            @RequestParam String bloodGroup,
            @RequestParam int units,
            @RequestParam(required = false, defaultValue = "ADD") String operation) {
        try {
            int delta = "REMOVE".equalsIgnoreCase(operation) ? -units : units;
            Inventory updated = inventoryService.updateInventory(uid, bloodGroup, delta);
            return ResponseEntity.ok(updated);
        } catch (RuntimeException e) {
            Map<String, String> error = new HashMap<>();
            error.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    /** Explicit add endpoint (always positive delta) */
    @PostMapping("/hospital/{uid}/add")
    public ResponseEntity<?> addInventory(
            @PathVariable String uid,
            @RequestParam String bloodGroup,
            @RequestParam int units) {
        try {
            if (units <= 0) {
                Map<String, String> error = new HashMap<>();
                error.put("message", "Units to add must be a positive number");
                return ResponseEntity.badRequest().body(error);
            }
            Inventory added = inventoryService.addInventory(uid, bloodGroup, units);
            return ResponseEntity.ok(added);
        } catch (RuntimeException e) {
            Map<String, String> error = new HashMap<>();
            error.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }
}
