package com.bloodconnect.service;

import com.bloodconnect.model.Patient;
import com.bloodconnect.model.User;
import com.bloodconnect.repository.PatientRepository;
import com.bloodconnect.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Objects;

@Service
public class PatientService {

    @Autowired
    private PatientRepository patientRepository;

    @Autowired
    private UserRepository userRepository;

    public Patient getPatientByUid(String uid) {
        User user = userRepository.findByUid(uid)
                .orElseThrow(() -> new RuntimeException("User not found"));

        return patientRepository.findByUser(user)
                .orElseThrow(() -> new RuntimeException("Patient profile not found"));
    }

    public Patient registerPatient(String uid, Patient patient) {
        User user = userRepository.findByUid(uid)
                .orElseThrow(() -> new RuntimeException("User not found"));

        patient.setUser(user);
        return patientRepository.save(patient);
    }

    public Patient updatePatient(String uid, Patient patientData) {
        Patient existingPatient = getPatientByUid(uid);

        if (patientData.getName() != null)      existingPatient.setName(patientData.getName());
        if (patientData.getBloodGroup() != null) existingPatient.setBloodGroup(patientData.getBloodGroup());
        if (patientData.getDob() != null)        existingPatient.setDob(patientData.getDob());
        if (patientData.getPhone() != null)      existingPatient.setPhone(patientData.getPhone());
        if (patientData.getAddress() != null)    existingPatient.setAddress(patientData.getAddress());
        if (patientData.getDisease() != null)    existingPatient.setDisease(patientData.getDisease());
        if (patientData.getLatitude() != null)   existingPatient.setLatitude(patientData.getLatitude());
        if (patientData.getLongitude() != null)  existingPatient.setLongitude(patientData.getLongitude());

        // FIX: getPatientByUid throws if not found, so existingPatient is never null here.
        // Objects.requireNonNull makes this contract explicit to the null checker.
        return patientRepository.save(Objects.requireNonNull(existingPatient, "Patient must not be null"));
    }
}