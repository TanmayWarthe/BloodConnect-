package com.bloodconnect.controller;

import com.bloodconnect.model.Patient;
import com.bloodconnect.service.PatientService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/patients")
@CrossOrigin(origins = "*")
public class PatientController {

    @Autowired
    private PatientService patientService;

    @PostMapping("/register")
    public ResponseEntity<?> registerPatient(@RequestParam("uid") String uid, @RequestBody Patient patient) {
        try {
            Patient registered = patientService.registerPatient(uid, patient);
            return ResponseEntity.ok(registered);
        } catch (RuntimeException e) {
            Map<String, String> error = new HashMap<>();
            error.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    @GetMapping("/{uid}")
    public ResponseEntity<?> getPatient(@PathVariable("uid") String uid) {
        try {
            Patient patient = patientService.getPatientByUid(uid);
            return ResponseEntity.ok(patient);
        } catch (RuntimeException e) {
            Map<String, String> error = new HashMap<>();
            error.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    @PutMapping("/{uid}")
    public ResponseEntity<?> updatePatient(@PathVariable("uid") String uid, @RequestBody Patient patient) {
        try {
            Patient updated = patientService.updatePatient(uid, patient);
            return ResponseEntity.ok(updated);
        } catch (RuntimeException e) {
            Map<String, String> error = new HashMap<>();
            error.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }
}
