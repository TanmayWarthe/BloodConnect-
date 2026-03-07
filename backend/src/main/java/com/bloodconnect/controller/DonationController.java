package com.bloodconnect.controller;

import com.bloodconnect.model.Donation;
import com.bloodconnect.service.DonationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/donations")
@CrossOrigin(origins = "*")
public class DonationController {

    @Autowired
    private DonationService donationService;

    /**
     * Donor accepts a blood request
     */
    @PostMapping("/donor/{uid}/accept/{requestId}")
    public ResponseEntity<?> donorAcceptRequest(
            @PathVariable String uid,
            @PathVariable Long requestId) {
        try {
            Donation donation = donationService.donorAcceptRequest(uid, requestId);
            return ResponseEntity.ok(donation);
        } catch (RuntimeException e) {
            Map<String, String> error = new HashMap<>();
            error.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    /**
     * Hospital accepts a blood request
     */
    @PostMapping("/hospital/{uid}/accept/{requestId}")
    public ResponseEntity<?> hospitalAcceptRequest(
            @PathVariable String uid,
            @PathVariable Long requestId) {
        try {
            Donation donation = donationService.hospitalAcceptRequest(uid, requestId);
            return ResponseEntity.ok(donation);
        } catch (RuntimeException e) {
            Map<String, String> error = new HashMap<>();
            error.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    /**
     * Complete a scheduled donation
     */
    @PostMapping("/{id}/complete")
    public ResponseEntity<?> completeDonation(@PathVariable Long id) {
        try {
            Donation donation = donationService.completeDonation(id);
            return ResponseEntity.ok(donation);
        } catch (RuntimeException e) {
            Map<String, String> error = new HashMap<>();
            error.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    /**
     * Cancel a donation
     */
    @PostMapping("/{id}/cancel")
    public ResponseEntity<?> cancelDonation(@PathVariable Long id, @RequestParam String reason) {
        try {
            Donation donation = donationService.cancelDonation(id, reason);
            return ResponseEntity.ok(donation);
        } catch (RuntimeException e) {
            Map<String, String> error = new HashMap<>();
            error.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    /**
     * Record general donation (not linked to specific request)
     */
    @PostMapping("/general")
    public ResponseEntity<?> recordGeneralDonation(
            @RequestParam String donorUid,
            @RequestParam String hospitalUid,
            @RequestParam String bloodGroup,
            @RequestParam int units) {
        try {
            Donation donation = donationService.recordGeneralDonation(
                    donorUid, hospitalUid, bloodGroup, units);
            return ResponseEntity.ok(donation);
        } catch (RuntimeException e) {
            Map<String, String> error = new HashMap<>();
            error.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    /**
     * Check if request is already accepted
     */
    @GetMapping("/request/{requestId}/status")
    public ResponseEntity<Map<String, Object>> getRequestStatus(@PathVariable Long requestId) {
        Map<String, Object> response = new HashMap<>();
        boolean isAccepted = donationService.isRequestAccepted(requestId);
        response.put("isAccepted", isAccepted);

        if (isAccepted) {
            Optional<Donation> donation = donationService.getAcceptanceDetails(requestId);
            donation.ifPresent(d -> {
                if (d.getDonor() != null) {
                    response.put("acceptedBy", "donor");
                    response.put("donorName", d.getDonor().getName());
                } else if (d.getHospital() != null) {
                    response.put("acceptedBy", "hospital");
                    response.put("hospitalName", d.getHospital().getHospitalName());
                }
            });
        }

        return ResponseEntity.ok(response);
    }

    @GetMapping("/donor/{uid}")
    public ResponseEntity<java.util.List<Donation>> getDonorHistory(@PathVariable String uid) {
        return ResponseEntity.ok(donationService.getDonationsByDonor(uid));
    }

    @GetMapping("/hospital/{uid}")
    public ResponseEntity<java.util.List<Donation>> getHospitalHistory(@PathVariable String uid) {
        return ResponseEntity.ok(donationService.getDonationsByHospital(uid));
    }
}
