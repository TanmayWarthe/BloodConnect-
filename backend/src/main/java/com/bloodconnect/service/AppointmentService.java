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
        User user = userRepository.findByFirebaseUid(donorUid)
                .orElseThrow(() -> new RuntimeException("User not found"));
        Donor donor = donorRepository.findByUser(user)
                .orElseThrow(() -> new RuntimeException("Donor profile not found"));
        return appointmentRepository.findByDonorId(donor.getId());
    }

    public List<Appointment> getAppointmentsByHospital(String hospitalUid) {
        User user = userRepository.findByFirebaseUid(hospitalUid)
                .orElseThrow(() -> new RuntimeException("User not found"));
        Hospital hospital = hospitalRepository.findByUser(user)
                .orElseThrow(() -> new RuntimeException("Hospital profile not found"));
        return appointmentRepository.findByHospitalId(hospital.getId());
    }

    public Appointment completeAppointment(Long appointmentId) {
        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new RuntimeException("Appointment not found"));

        appointment.setStatus(AppointmentStatus.COMPLETED);
        return appointmentRepository.save(appointment);
    }

    public Appointment cancelAppointment(Long appointmentId, String reason) {
        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new RuntimeException("Appointment not found"));

        appointment.setStatus(AppointmentStatus.CANCELLED);
        appointment.setCancellationReason(reason);
        return appointmentRepository.save(appointment);
    }

    public Appointment getAppointmentById(Long appointmentId) {
        return appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new RuntimeException("Appointment not found"));
    }
}
