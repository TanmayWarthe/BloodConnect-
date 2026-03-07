package com.bloodconnect.service;

import com.bloodconnect.model.BloodRequest;
import com.bloodconnect.model.BloodRequest.RequestStatus;
import com.bloodconnect.model.Donor;
import com.bloodconnect.model.Hospital;
import com.bloodconnect.model.Patient;
import com.bloodconnect.model.User;
import com.bloodconnect.repository.BloodRequestRepository;
import com.bloodconnect.repository.DonorRepository;
import com.bloodconnect.repository.HospitalRepository;
import com.bloodconnect.repository.PatientRepository;
import com.bloodconnect.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import lombok.extern.slf4j.Slf4j;

import java.util.List;

@Slf4j
@Service
public class BloodRequestService {

    @Autowired
    private BloodRequestRepository requestRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private HospitalRepository hospitalRepository;

    @Autowired
    private PatientRepository patientRepository;

    @Autowired
    private DonorRepository donorRepository;

    @Autowired
    private NotificationService notificationService;

    /**
     * Create blood request from patient
     */
    public BloodRequest createRequest(String firebaseUid, BloodRequest request) {
        User requester = userRepository.findByFirebaseUid(firebaseUid)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Try to get patient entity, but don't fail if it doesn't exist
        Patient patient = patientRepository.findByUser(requester).orElse(null);

        request.setRequester(requester);

        // Link to patient if profile exists
        if (patient != null) {
            request.setPatient(patient);
            request.setPatientName(patient.getName());
        } else {
            // Use user's email if patient profile doesn't exist
            request.setPatientName(requester.getEmail());
        }

        request.setStatus(RequestStatus.PENDING);

        BloodRequest savedRequest = requestRepository.save(request);

        // 🔔 NOTIFY: Send notifications to donors and hospitals
        try {
            // Notify all available donors with matching blood type
            List<Donor> matchingDonors = donorRepository.findByBloodGroup(request.getBloodGroup());
            for (Donor donor : matchingDonors) {
                notificationService.createNotification(
                        donor.getUser(),
                        "REQUEST_CREATED",
                        "New " + request.getBloodGroup() + " blood request (" + request.getUrgency() + ") - "
                                + request.getUnitsRequired() + " units needed",
                        savedRequest.getId());
            }

            // Notify all hospitals
            List<Hospital> hospitals = hospitalRepository.findAll();
            for (Hospital hospital : hospitals) {
                notificationService.createNotification(
                        hospital.getUser(),
                        "REQUEST_CREATED",
                        "New blood request: " + request.getBloodGroup() + " - " + request.getUnitsRequired()
                                + " units (" + request.getUrgency() + ")",
                        savedRequest.getId());
            }
        } catch (Exception e) {
            // Log error but don't fail request creation
            log.warn("Failed to send notifications for request: {}", e.getMessage());
        }

        return savedRequest;
    }

    public List<BloodRequest> getPendingRequests() {
        return requestRepository.findByStatus(RequestStatus.PENDING);
    }

    public List<BloodRequest> getMyRequests(String firebaseUid) {
        User user = userRepository.findByFirebaseUid(firebaseUid)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return requestRepository.findByRequesterId(user.getId());
    }

    /**
     * Create blood request from hospital (for a patient)
     */
    public BloodRequest createHospitalRequest(String firebaseUid, BloodRequest request) {
        User user = userRepository.findByFirebaseUid(firebaseUid)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Hospital hospital = hospitalRepository.findByUser(user)
                .orElseThrow(() -> new RuntimeException("Hospital profile not found"));

        request.setRequester(user);

        // If patient ID is provided, link to patient entity
        if (request.getPatient() != null && request.getPatient().getId() != null) {
            Patient patient = patientRepository.findById(request.getPatient().getId())
                    .orElseThrow(() -> new RuntimeException("Patient not found"));
            request.setPatient(patient);
            request.setPatientName(patient.getName());
        }

        // Set hospital name if not provided
        if (request.getHospitalName() == null || request.getHospitalName().isEmpty()) {
            request.setHospitalName(hospital.getHospitalName());
        }

        request.setStatus(RequestStatus.PENDING);
        return requestRepository.save(request);
    }

    public List<BloodRequest> findRequestsByHospital(String firebaseUid) {
        User user = userRepository.findByFirebaseUid(firebaseUid)
                .orElseThrow(() -> new RuntimeException("User not found"));

        return requestRepository.findByRequester(user);
    }

    public BloodRequest updateRequestStatus(Long requestId, RequestStatus status) {
        BloodRequest request = requestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Request not found"));

        request.setStatus(status);
        return requestRepository.save(request);
    }
}
