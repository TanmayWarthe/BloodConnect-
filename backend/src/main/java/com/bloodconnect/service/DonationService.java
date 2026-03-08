package com.bloodconnect.service;

import com.bloodconnect.model.*;
import com.bloodconnect.model.Donation.DonationType;
import com.bloodconnect.model.Donation.DonationStatus;
import com.bloodconnect.model.BloodRequest.RequestStatus;
import com.bloodconnect.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import lombok.extern.slf4j.Slf4j;

import java.time.LocalDate;
import java.time.LocalDateTime;
// FIX: removed unused import java.util.List (java.util.List is referenced via inline java.util.List<> below)
import java.util.Objects;
import java.util.Optional;

@Slf4j
@Service
public class DonationService {

        @Autowired
        private DonationRepository donationRepository;

        @Autowired
        private BloodRequestRepository requestRepository;

        @Autowired
        private DonorRepository donorRepository;

        @Autowired
        private HospitalRepository hospitalRepository;

        @Autowired
        private UserRepository userRepository;

        @Autowired
        private InventoryService inventoryService;

        @Autowired
        private AppointmentService appointmentService;

        @Autowired
        private NotificationService notificationService;

        /**
         * Donor accepts a blood request - Creates SCHEDULED donation with appointment
         */
        @Transactional
        public Donation donorAcceptRequest(String donorUid, Long requestId) {
                User donorUser = userRepository.findByUid(donorUid)
                                .orElseThrow(() -> new RuntimeException("Donor user not found"));
                Donor donor = donorRepository.findByUser(donorUser)
                                .orElseThrow(() -> new RuntimeException("Donor profile not found"));

                // FIX: null-safe unbox for requestId parameter
                BloodRequest request = requestRepository.findById(
                                Objects.requireNonNull(requestId, "Request ID must not be null"))
                                .orElseThrow(() -> new RuntimeException("Request not found"));

                if (request.getStatus() != RequestStatus.PENDING) {
                        throw new RuntimeException("Request already " + request.getStatus());
                }

                Hospital hospital = null;
                Appointment appointment = null;

                if (request.getHospitalName() != null && !request.getHospitalName().isEmpty()) {
                        try {
                                hospital = hospitalRepository.findAll().stream()
                                                .filter(h -> h.getHospitalName()
                                                                .equalsIgnoreCase(request.getHospitalName()))
                                                .findFirst()
                                                .orElse(null);

                                if (hospital != null) {
                                        appointment = appointmentService.createAppointment(
                                                        donor,
                                                        hospital,
                                                        LocalDateTime.now().plusDays(1),
                                                        "Blood donation for request #" + requestId);
                                }
                        } catch (Exception e) {
                                log.warn("Could not create appointment for request #{}: {}", requestId, e.getMessage());
                        }
                }

                Donation donation = new Donation();
                donation.setDonor(donor);
                donation.setRequest(request);
                donation.setBloodGroup(request.getBloodGroup());
                donation.setUnits(request.getUnitsRequired());
                donation.setDonationType(DonationType.DIRECT_TO_PATIENT);
                donation.setStatus(DonationStatus.SCHEDULED);
                donation.setAppointment(appointment);

                request.setStatus(RequestStatus.MATCHED);
                requestRepository.save(request);

                Donation savedDonation = donationRepository.save(donation);

                // 🔔 NOTIFY
                try {
                        if (request.getRequester() != null) {
                                notificationService.createNotification(
                                                request.getRequester(),
                                                "REQUEST_ACCEPTED",
                                                "Donor " + donor.getName() + " accepted your " + request.getBloodGroup()
                                                                + " request!",
                                                request.getId());
                        }

                        java.util.List<Hospital> allHospitals = hospitalRepository.findAll();
                        for (Hospital h : allHospitals) {
                                notificationService.createNotification(
                                                h.getUser(),
                                                "REQUEST_ACCEPTED",
                                                "Donor accepted " + request.getBloodGroup()
                                                                + " request - Ready for collection",
                                                request.getId());
                        }
                } catch (Exception e) {
                        log.warn("Failed to send notifications for donation: {}", e.getMessage());
                }

                return savedDonation;
        }

        /**
         * Hospital accepts a blood request - Validates inventory first
         */
        @Transactional
        public Donation hospitalAcceptRequest(String hospitalUid, Long requestId) {
                User hospitalUser = userRepository.findByUid(hospitalUid)
                                .orElseThrow(() -> new RuntimeException("Hospital user not found"));
                Hospital hospital = hospitalRepository.findByUser(hospitalUser)
                                .orElseThrow(() -> new RuntimeException("Hospital profile not found"));

                // FIX: null-safe unbox for requestId parameter
                BloodRequest request = requestRepository.findById(
                                Objects.requireNonNull(requestId, "Request ID must not be null"))
                                .orElseThrow(() -> new RuntimeException("Request not found"));

                if (request.getStatus() != RequestStatus.PENDING) {
                        throw new RuntimeException("Request already " + request.getStatus());
                }

                inventoryService.validateInventory(hospitalUid, request.getBloodGroup(),
                                request.getUnitsRequired());

                Donation donation = new Donation();
                donation.setHospital(hospital);
                donation.setRequest(request);
                donation.setBloodGroup(request.getBloodGroup());
                donation.setUnits(request.getUnitsRequired());
                donation.setDonationType(DonationType.TO_HOSPITAL);
                donation.setStatus(DonationStatus.COMPLETED);
                donation.setCompletedDate(LocalDateTime.now());

                donation = donationRepository.save(donation);

                request.setStatus(RequestStatus.FULFILLED);
                requestRepository.save(request);

                inventoryService.updateInventory(hospitalUid, request.getBloodGroup(),
                                -request.getUnitsRequired());

                // 🔔 NOTIFY
                try {
                        if (request.getRequester() != null) {
                                notificationService.createNotification(
                                                request.getRequester(),
                                                "REQUEST_FULFILLED",
                                                "Your " + request.getBloodGroup() + " request has been fulfilled by "
                                                                + hospital.getHospitalName(),
                                                request.getId());
                        }

                        // FIX: null-safe unbox for requestId in findByRequestId
                        Optional<Donation> donorDonation = donationRepository.findByRequestId(
                                        Objects.requireNonNull(requestId, "Request ID must not be null"))
                                        .stream()
                                        .filter(d -> d.getDonor() != null)
                                        .findFirst();

                        if (donorDonation.isPresent() && donorDonation.get().getDonor() != null) {
                                notificationService.createNotification(
                                                donorDonation.get().getDonor().getUser(),
                                                "REQUEST_FULFILLED",
                                                "Your donation for " + request.getBloodGroup()
                                                                + " request has been collected by "
                                                                + hospital.getHospitalName(),
                                                request.getId());
                        }
                } catch (Exception e) {
                        log.warn("Failed to send notifications for hospital fulfillment: {}", e.getMessage());
                }

                return donation;
        }

        /**
         * Complete a scheduled donation
         */
        @Transactional
        public Donation completeDonation(Long donationId) {
                // FIX: null-safe unbox for donationId parameter
                Donation donation = donationRepository.findById(
                                Objects.requireNonNull(donationId, "Donation ID must not be null"))
                                .orElseThrow(() -> new RuntimeException("Donation not found"));

                if (donation.getStatus() != DonationStatus.SCHEDULED) {
                        throw new RuntimeException("Donation is not in SCHEDULED status");
                }

                donation.setStatus(DonationStatus.COMPLETED);
                donation.setCompletedDate(LocalDateTime.now());

                BloodRequest request = donation.getRequest();
                if (request != null) {
                        request.setStatus(RequestStatus.FULFILLED);
                        requestRepository.save(request);
                }

                Donor donor = donation.getDonor();
                if (donor != null) {
                        donor.setLastDonationDate(LocalDate.now());
                        donorRepository.save(donor);
                }

                if (donation.getDonationType() == DonationType.TO_HOSPITAL && donation.getHospital() != null) {
                        Hospital hospital = donation.getHospital();
                        // FIX: null-safe unbox for hospital user id
                        inventoryService.updateInventory(
                                        String.valueOf(Objects.requireNonNull(
                                                hospital.getUser().getId(), "Hospital user ID must not be null")),
                                        donation.getBloodGroup(),
                                        donation.getUnits());
                }

                if (donation.getAppointment() != null) {
                        appointmentService.completeAppointment(donation.getAppointment().getId());
                }

                return donationRepository.save(donation);
        }

        /**
         * Cancel a donation
         */
        @Transactional
        public Donation cancelDonation(Long donationId, String reason) {
                // FIX: null-safe unbox for donationId parameter
                Donation donation = donationRepository.findById(
                                Objects.requireNonNull(donationId, "Donation ID must not be null"))
                                .orElseThrow(() -> new RuntimeException("Donation not found"));

                if (donation.getStatus() == DonationStatus.COMPLETED) {
                        throw new RuntimeException("Cannot cancel completed donation");
                }

                donation.setStatus(DonationStatus.CANCELLED);

                BloodRequest request = donation.getRequest();
                if (request != null && request.getStatus() == RequestStatus.MATCHED) {
                        request.setStatus(RequestStatus.PENDING);
                        requestRepository.save(request);
                }

                if (donation.getAppointment() != null) {
                        appointmentService.cancelAppointment(donation.getAppointment().getId(), reason);
                }

                return donationRepository.save(donation);
        }

        /**
         * Record a general donation (not linked to specific request)
         */
        @Transactional
        public Donation recordGeneralDonation(String donorUid, String hospitalUid,
                        String bloodGroup, int units) {
                User donorUser = userRepository.findByUid(donorUid)
                                .orElseThrow(() -> new RuntimeException("Donor user not found"));
                Donor donor = donorRepository.findByUser(donorUser)
                                .orElseThrow(() -> new RuntimeException("Donor profile not found"));

                User hospitalUser = userRepository.findByUid(hospitalUid)
                                .orElseThrow(() -> new RuntimeException("Hospital user not found"));
                Hospital hospital = hospitalRepository.findByUser(hospitalUser)
                                .orElseThrow(() -> new RuntimeException("Hospital profile not found"));

                Donation donation = new Donation();
                donation.setDonor(donor);
                donation.setHospital(hospital);
                donation.setBloodGroup(bloodGroup);
                donation.setUnits(units);
                donation.setDonationType(DonationType.TO_HOSPITAL);
                donation.setStatus(DonationStatus.COMPLETED);
                donation.setCompletedDate(LocalDateTime.now());

                donation = donationRepository.save(donation);

                inventoryService.updateInventory(hospitalUid, bloodGroup, units);

                donor.setLastDonationDate(LocalDate.now());
                donorRepository.save(donor);

                return donation;
        }

        public boolean isRequestAccepted(Long requestId) {
                Optional<Donation> donation = donationRepository.findByRequestId(
                                Objects.requireNonNull(requestId, "Request ID must not be null"))
                                .stream().findFirst();
                return donation.isPresent();
        }

        public Optional<Donation> getAcceptanceDetails(Long requestId) {
                return donationRepository.findByRequestId(
                                Objects.requireNonNull(requestId, "Request ID must not be null"))
                                .stream().findFirst();
        }

        public java.util.List<Donation> getDonationsByDonor(String donorUid) {
                User donorUser = userRepository.findByUid(donorUid)
                                .orElseThrow(() -> new RuntimeException("Donor user not found"));
                Donor donor = donorRepository.findByUser(donorUser)
                                .orElseThrow(() -> new RuntimeException("Donor profile not found"));
                // FIX: null-safe unbox
                return donationRepository.findByDonorId(
                                Objects.requireNonNull(donor.getId(), "Donor ID must not be null"));
        }

        public java.util.List<Donation> getDonationsByHospital(String hospitalUid) {
                User hospitalUser = userRepository.findByUid(hospitalUid)
                                .orElseThrow(() -> new RuntimeException("Hospital user not found"));
                Hospital hospital = hospitalRepository.findByUser(hospitalUser)
                                .orElseThrow(() -> new RuntimeException("Hospital profile not found"));
                // FIX: null-safe unbox
                return donationRepository.findByHospitalId(
                                Objects.requireNonNull(hospital.getId(), "Hospital ID must not be null"));
        }
}