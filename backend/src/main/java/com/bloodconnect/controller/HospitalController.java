package com.bloodconnect.controller;

import com.bloodconnect.model.Hospital;
import com.bloodconnect.service.HospitalService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/hospitals")
@CrossOrigin(origins = "*")
public class HospitalController {

    @Autowired
    private HospitalService hospitalService;

    /** Register a new hospital profile linked to a Firebase user */
    @PostMapping("/register")
    public ResponseEntity<?> registerHospital(@RequestParam("uid") String uid, @RequestBody Hospital hospital) {
        try {
            Hospital registered = hospitalService.registerHospital(uid, hospital);
            return ResponseEntity.ok(registered);
        } catch (RuntimeException e) {
            Map<String, String> error = new HashMap<>();
            error.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    /** Get hospital profile by Firebase UID */
    @GetMapping("/profile/{uid}")
    public ResponseEntity<?> getHospitalProfile(@PathVariable("uid") String uid) {
        try {
            Hospital hospital = hospitalService.getHospitalByUid(uid);
            return ResponseEntity.ok(hospital);
        } catch (RuntimeException e) {
            Map<String, String> error = new HashMap<>();
            error.put("message", e.getMessage());
            return ResponseEntity.status(404).body(error);
        }
    }

    /** Update hospital profile by Firebase UID */
    @PutMapping("/{uid}")
    public ResponseEntity<?> updateHospital(@PathVariable("uid") String uid, @RequestBody Hospital hospital) {
        try {
            Hospital updated = hospitalService.updateHospital(uid, hospital);
            return ResponseEntity.ok(updated);
        } catch (RuntimeException e) {
            Map<String, String> error = new HashMap<>();
            error.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    /** Get all hospitals — used by the map page and donor matching */
    @GetMapping("/all")
    public ResponseEntity<List<Hospital>> getAllHospitals() {
        return ResponseEntity.ok(hospitalService.getAllHospitals());
    }
}
