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

    /** Get all donors (used by the map to show markers) */
    @GetMapping
    public ResponseEntity<List<Donor>> getAllDonors() {
        return ResponseEntity.ok(donorService.getAllDonors());
    }

    /** Register a new donor profile linked to a Firebase user */
    @PostMapping("/register")
    public ResponseEntity<?> registerDonor(@RequestParam("uid") String uid, @RequestBody Donor donor) {
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
    public ResponseEntity<?> getDonorProfile(@PathVariable("uid") String uid) {
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
    public ResponseEntity<?> updateDonorProfile(@PathVariable("uid") String uid, @RequestBody Donor donor) {
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
            @PathVariable("uid") String uid,
            @RequestParam("status") String status) {
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
            @RequestParam("bloodGroup") String bloodGroup,
            @RequestParam(name = "lat", required = false) Double lat,
            @RequestParam(name = "lng", required = false) Double lng,
            @RequestParam(name = "radius", required = false, defaultValue = "50") Double radius) {
        return ResponseEntity.ok(donorService.findNearbyDonors(bloodGroup, lat, lng, radius));
    }
}
