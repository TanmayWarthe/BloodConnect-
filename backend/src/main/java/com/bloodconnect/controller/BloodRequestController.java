package com.bloodconnect.controller;

import com.bloodconnect.model.BloodRequest;
import com.bloodconnect.model.BloodRequest.RequestStatus;
import com.bloodconnect.service.BloodRequestService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/requests")
@CrossOrigin(origins = "*")
public class BloodRequestController {

    @Autowired
    private BloodRequestService requestService;

    @PostMapping
    public ResponseEntity<BloodRequest> createRequest(@RequestParam("uid") String uid, @RequestBody BloodRequest request) {
        return ResponseEntity.ok(requestService.createRequest(uid, request));
    }

    @GetMapping("/pending")
    public ResponseEntity<List<BloodRequest>> getPendingRequests() {
        return ResponseEntity.ok(requestService.getPendingRequests());
    }

    @GetMapping("/my/{uid}")
    public ResponseEntity<List<BloodRequest>> getMyRequests(@PathVariable("uid") String uid) {
        return ResponseEntity.ok(requestService.getMyRequests(uid));
    }

    @PostMapping("/hospital/{uid}")
    public ResponseEntity<BloodRequest> createHospitalRequest(
            @PathVariable("uid") String uid,
            @RequestBody BloodRequest request) {
        BloodRequest created = requestService.createHospitalRequest(uid, request);
        return ResponseEntity.ok(created);
    }

    @GetMapping("/hospital/{uid}")
    public ResponseEntity<List<BloodRequest>> getHospitalRequests(@PathVariable("uid") String uid) {
        List<BloodRequest> requests = requestService.findRequestsByHospital(uid);
        return ResponseEntity.ok(requests);
    }

    @PutMapping("/{requestId}/status")
    public ResponseEntity<BloodRequest> updateRequestStatus(
            @PathVariable("requestId") Long requestId,
            @RequestParam("status") String status) {
        RequestStatus requestStatus = RequestStatus.valueOf(status.toUpperCase());
        BloodRequest updated = requestService.updateRequestStatus(requestId, requestStatus);
        return ResponseEntity.ok(updated);
    }
}
