package com.bloodconnect.controller;

import com.bloodconnect.model.Donor;
import com.bloodconnect.service.DonorService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/donors")
@CrossOrigin(origins = "*")
public class DonorController {

    @Autowired
    private DonorService donorService;

    /** Register a new donor profile linked to a Firebase user */
    @PostMapping("/register")
    public ResponseEntity<?> registerDonor(@RequestParam String uid, @RequestBody Donor donor) {
        try {
            Donor registered = donorService.registerDonor(uid, donor);
            return ResponseEntity.ok(registered);
        } catch (RuntimeException e) {
            Map<String, String> error = new HashMap<>();
            error.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    /** Get donor profile by Firebase UID */
    @GetMapping("/{uid}")
    public ResponseEntity<?> getDonorProfile(@PathVariable String uid) {
        try {
            Donor donor = donorService.getDonorByUid(uid);
            return ResponseEntity.ok(donor);
        } catch (RuntimeException e) {
            Map<String, String> error = new HashMap<>();
            error.put("message", e.getMessage());
            return ResponseEntity.status(404).body(error);
        }
    }

    /** Update donor profile by Firebase UID */
    @PutMapping("/{uid}")
    public ResponseEntity<?> updateDonorProfile(@PathVariable String uid, @RequestBody Donor donor) {
        try {
            Donor updated = donorService.updateDonor(uid, donor);
            return ResponseEntity.ok(updated);
        } catch (RuntimeException e) {
            Map<String, String> error = new HashMap<>();
            error.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    /** Update donor availability status */
    @PutMapping("/availability/{uid}")
    public ResponseEntity<?> updateAvailability(
            @PathVariable String uid,
            @RequestParam String status) {
        try {
            Donor updated = donorService.updateAvailability(uid, status);
            return ResponseEntity.ok(updated);
        } catch (RuntimeException e) {
            Map<String, String> error = new HashMap<>();
            error.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    /** Find nearby available donors by blood group and optional location */
    @GetMapping("/nearby")
    public ResponseEntity<List<Donor>> findNearby(
            @RequestParam String bloodGroup,
            @RequestParam(required = false) Double lat,
            @RequestParam(required = false) Double lng,
            @RequestParam(required = false, defaultValue = "50") Double radius) {
        return ResponseEntity.ok(donorService.findNearbyDonors(bloodGroup, lat, lng, radius));
    }
}
