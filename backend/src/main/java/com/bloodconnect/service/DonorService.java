package com.bloodconnect.service;

import com.bloodconnect.model.Donor;
import com.bloodconnect.model.Donor.AvailabilityStatus;
import com.bloodconnect.model.User;
import com.bloodconnect.repository.DonorRepository;
import com.bloodconnect.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
public class DonorService {

    @Autowired
    private DonorRepository donorRepository;

    @Autowired
    private UserRepository userRepository;

    /** Register a new donor profile for an existing user */
    public Donor registerDonor(String uid, Donor donorData) {
        User user = userRepository.findByUid(uid)
                .orElseThrow(() -> new RuntimeException("User not found with UID: " + uid));

        if (donorRepository.findByUser(user).isPresent()) {
            throw new RuntimeException("Donor profile already exists for this user");
        }

        donorData.setUser(user);
        return donorRepository.save(donorData);
    }

    /** Retrieve donor profile by UID */
    public Donor getDonorByUid(String uid) {
        User user = userRepository.findByUid(uid)
                .orElseThrow(() -> new RuntimeException("User not found with UID: " + uid));

        return donorRepository.findByUser(user)
                .orElseThrow(() -> new RuntimeException("Donor profile not found"));
    }

    /** Update donor profile fields (only non-null fields are overwritten) */
    public Donor updateDonor(String uid, Donor donorData) {
        Donor existing = getDonorByUid(uid);

        if (donorData.getName() != null)             existing.setName(donorData.getName());
        if (donorData.getBloodGroup() != null)       existing.setBloodGroup(donorData.getBloodGroup());
        if (donorData.getRhFactor() != null)         existing.setRhFactor(donorData.getRhFactor());
        if (donorData.getDob() != null)              existing.setDob(donorData.getDob());
        if (donorData.getGender() != null)           existing.setGender(donorData.getGender());
        if (donorData.getPhone() != null)            existing.setPhone(donorData.getPhone());
        if (donorData.getAddress() != null)          existing.setAddress(donorData.getAddress());
        if (donorData.getLatitude() != null)         existing.setLatitude(donorData.getLatitude());
        if (donorData.getLongitude() != null)        existing.setLongitude(donorData.getLongitude());
        if (donorData.getLastDonationDate() != null) existing.setLastDonationDate(donorData.getLastDonationDate());

        // FIX: getDonorByUid throws if not found, so existing is never null here.
        // Objects.requireNonNull makes this contract explicit to the null checker.
        return donorRepository.save(Objects.requireNonNull(existing, "Donor must not be null"));
    }

    /** Update availability status by UID */
    public Donor updateAvailability(String uid, String status) {
        Donor donor = getDonorByUid(uid);

        AvailabilityStatus newStatus;
        try {
            newStatus = AvailabilityStatus.valueOf(status.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new RuntimeException("Invalid availability status: " + status
                    + ". Valid values: AVAILABLE, BUSY, UNAVAILABLE");
        }

        donor.setAvailabilityStatus(newStatus);
        return donorRepository.save(Objects.requireNonNull(donor, "Donor must not be null"));
    }

    /**
     * Find available donors of a given blood group within a radius (km).
     * Uses Haversine formula for accurate distance calculation.
     */
    public List<Donor> findNearbyDonors(String bloodGroup, Double lat, Double lng, double radiusKm) {
        List<Donor> candidates = donorRepository.findByBloodGroupAndAvailabilityStatus(
                bloodGroup, AvailabilityStatus.AVAILABLE);

        if (lat != null && lng != null) {
            return candidates.stream()
                    .filter(d -> d.getLatitude() != null && d.getLongitude() != null)
                    .filter(d -> calculateHaversineDistance(lat, lng, d.getLatitude(), d.getLongitude()) <= radiusKm)
                    .collect(Collectors.toList());
        }

        return candidates;
    }

    /**
     * Haversine formula — calculates great-circle distance between two lat/lng points (km).
     */
    private double calculateHaversineDistance(double lat1, double lon1, double lat2, double lon2) {
        final int EARTH_RADIUS_KM = 6371;
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return EARTH_RADIUS_KM * c;
    }
}