package com.bloodconnect.service;

import com.bloodconnect.model.Hospital;
import com.bloodconnect.model.User;
import com.bloodconnect.repository.HospitalRepository;
import com.bloodconnect.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Objects;

@Service
public class HospitalService {

    @Autowired
    private HospitalRepository hospitalRepository;

    @Autowired
    private UserRepository userRepository;

    /** Retrieve hospital profile by UID */
    public Hospital getHospitalByUid(String uid) {
        User user = userRepository.findByUid(uid)
                .orElseThrow(() -> new RuntimeException("User not found with UID: " + uid));

        return hospitalRepository.findByUser(user)
                .orElseThrow(() -> new RuntimeException("Hospital profile not found"));
    }

    /** Register a new hospital profile and link it to an existing user */
    public Hospital registerHospital(String uid, Hospital hospital) {
        User user = userRepository.findByUid(uid)
                .orElseThrow(() -> new RuntimeException("User not found with UID: " + uid));

        if (hospitalRepository.findByUser(user).isPresent()) {
            throw new RuntimeException("Hospital profile already exists for this user");
        }

        hospital.setUser(user);
        return hospitalRepository.save(hospital);
    }

    /** Update hospital profile fields (only non-null values overwrite existing data) */
    public Hospital updateHospital(String uid, Hospital hospitalData) {
        Hospital existing = getHospitalByUid(uid);

        if (hospitalData.getHospitalName() != null)  existing.setHospitalName(hospitalData.getHospitalName());
        if (hospitalData.getLicenseNumber() != null) existing.setLicenseNumber(hospitalData.getLicenseNumber());
        if (hospitalData.getPhone() != null)         existing.setPhone(hospitalData.getPhone());
        if (hospitalData.getAddress() != null)       existing.setAddress(hospitalData.getAddress());
        if (hospitalData.getLatitude() != null)      existing.setLatitude(hospitalData.getLatitude());
        if (hospitalData.getLongitude() != null)     existing.setLongitude(hospitalData.getLongitude());

        // FIX: getHospitalByUid throws if not found, so existing is never null here.
        // Objects.requireNonNull makes this contract explicit to the null checker.
        return hospitalRepository.save(Objects.requireNonNull(existing, "Hospital must not be null"));
    }

    /** Retrieve all hospitals — used on the map page and for donor matching */
    public List<Hospital> getAllHospitals() {
        return hospitalRepository.findAll();
    }
}