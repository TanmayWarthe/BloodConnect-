package com.bloodconnect.service;

import com.bloodconnect.model.Appointment;
import com.bloodconnect.model.Appointment.AppointmentStatus;
import com.bloodconnect.model.Donor;
import com.bloodconnect.model.Hospital;
import com.bloodconnect.model.User;
import com.bloodconnect.repository.AppointmentRepository;
import com.bloodconnect.repository.DonorRepository;
import com.bloodconnect.repository.HospitalRepository;
import com.bloodconnect.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Objects;

@Service
public class AppointmentService {

    @Autowired
    private AppointmentRepository appointmentRepository;

    @Autowired
    private DonorRepository donorRepository;

    @Autowired
    private HospitalRepository hospitalRepository;

    @Autowired
    private UserRepository userRepository;

    public Appointment createAppointment(Donor donor, Hospital hospital, LocalDateTime scheduledDate) {
        Appointment appointment = new Appointment();
        appointment.setDonor(donor);
        appointment.setHospital(hospital);
        appointment.setScheduledDate(scheduledDate);
        appointment.setStatus(AppointmentStatus.SCHEDULED);
        return appointmentRepository.save(appointment);
    }

    public Appointment createAppointment(Donor donor, Hospital hospital, LocalDateTime scheduledDate, String notes) {
        Appointment appointment = createAppointment(donor, hospital, scheduledDate);
        appointment.setNotes(notes);
        return appointmentRepository.save(appointment);
    }

    public List<Appointment> getAppointmentsByDonor(String donorUid) {
        User user = userRepository.findByUid(donorUid)
                .orElseThrow(() -> new RuntimeException("User not found"));
        Donor donor = donorRepository.findByUser(user)
                .orElseThrow(() -> new RuntimeException("Donor profile not found"));
        // FIX: null-safe unbox — donor is guaranteed non-null by orElseThrow above
        return appointmentRepository.findByDonorId(
                Objects.requireNonNull(donor.getId(), "Donor ID must not be null"));
    }

    public List<Appointment> getAppointmentsByHospital(String hospitalUid) {
        User user = userRepository.findByUid(hospitalUid)
                .orElseThrow(() -> new RuntimeException("User not found"));
        Hospital hospital = hospitalRepository.findByUser(user)
                .orElseThrow(() -> new RuntimeException("Hospital profile not found"));
        // FIX: null-safe unbox
        return appointmentRepository.findByHospitalId(
                Objects.requireNonNull(hospital.getId(), "Hospital ID must not be null"));
    }

    public Appointment completeAppointment(Long appointmentId) {
        // FIX: null-safe unbox on method parameter
        Appointment appointment = appointmentRepository.findById(
                Objects.requireNonNull(appointmentId, "Appointment ID must not be null"))
                .orElseThrow(() -> new RuntimeException("Appointment not found"));

        appointment.setStatus(AppointmentStatus.COMPLETED);
        return appointmentRepository.save(appointment);
    }

    public Appointment cancelAppointment(Long appointmentId, String reason) {
        // FIX: null-safe unbox on method parameter
        Appointment appointment = appointmentRepository.findById(
                Objects.requireNonNull(appointmentId, "Appointment ID must not be null"))
                .orElseThrow(() -> new RuntimeException("Appointment not found"));

        appointment.setStatus(AppointmentStatus.CANCELLED);
        appointment.setCancellationReason(reason);
        return appointmentRepository.save(appointment);
    }

    public Appointment getAppointmentById(Long appointmentId) {
        return appointmentRepository.findById(
                Objects.requireNonNull(appointmentId, "Appointment ID must not be null"))
                .orElseThrow(() -> new RuntimeException("Appointment not found"));
    }
}