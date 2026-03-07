package com.bloodconnect.service;

import com.bloodconnect.model.Hospital;
import com.bloodconnect.model.User;
import com.bloodconnect.repository.HospitalRepository;
import com.bloodconnect.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class HospitalService {

    @Autowired
    private HospitalRepository hospitalRepository;

    @Autowired
    private UserRepository userRepository;

    /** Retrieve hospital profile by Firebase UID */
    public Hospital getHospitalByUid(String firebaseUid) {
        User user = userRepository.findByFirebaseUid(firebaseUid)
                .orElseThrow(() -> new RuntimeException("User not found with UID: " + firebaseUid));

        return hospitalRepository.findByUser(user)
                .orElseThrow(() -> new RuntimeException("Hospital profile not found"));
    }

    /** Register a new hospital profile and link it to an existing Firebase user */
    public Hospital registerHospital(String firebaseUid, Hospital hospital) {
        User user = userRepository.findByFirebaseUid(firebaseUid)
                .orElseThrow(() -> new RuntimeException("User not found with UID: " + firebaseUid));

        // Prevent duplicate registration
        if (hospitalRepository.findByUser(user).isPresent()) {
            throw new RuntimeException("Hospital profile already exists for this user");
        }

        hospital.setUser(user);
        return hospitalRepository.save(hospital);
    }

    /** Update hospital profile fields (only non-null values overwrite existing data) */
    public Hospital updateHospital(String firebaseUid, Hospital hospitalData) {
        Hospital existing = getHospitalByUid(firebaseUid);

        if (hospitalData.getHospitalName() != null) existing.setHospitalName(hospitalData.getHospitalName());
        if (hospitalData.getLicenseNumber() != null) existing.setLicenseNumber(hospitalData.getLicenseNumber());
        if (hospitalData.getPhone() != null) existing.setPhone(hospitalData.getPhone());
        if (hospitalData.getAddress() != null) existing.setAddress(hospitalData.getAddress());
        if (hospitalData.getLatitude() != null) existing.setLatitude(hospitalData.getLatitude());
        if (hospitalData.getLongitude() != null) existing.setLongitude(hospitalData.getLongitude());

        return hospitalRepository.save(existing);
    }

    /** Retrieve all hospitals — used on the map page and for donor matching */
    public List<Hospital> getAllHospitals() {
        return hospitalRepository.findAll();
    }
}
