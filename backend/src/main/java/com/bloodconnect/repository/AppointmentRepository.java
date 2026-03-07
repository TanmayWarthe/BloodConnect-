package com.bloodconnect.repository;

import com.bloodconnect.model.Appointment;
import com.bloodconnect.model.Appointment.AppointmentStatus;
import com.bloodconnect.model.Donor;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;

public interface AppointmentRepository extends JpaRepository<Appointment, Long> {
    List<Appointment> findByDonorId(Long donorId);

    List<Appointment> findByHospitalId(Long hospitalId);

    List<Appointment> findByStatus(AppointmentStatus status);

    List<Appointment> findByDonorAndStatus(Donor donor, AppointmentStatus status);

    List<Appointment> findByScheduledDateBetween(LocalDateTime start, LocalDateTime end);
}
