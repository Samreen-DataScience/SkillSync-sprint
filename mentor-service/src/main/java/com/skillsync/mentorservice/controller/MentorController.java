package com.skillsync.mentorservice.controller;

import com.skillsync.mentorservice.dto.*;
import com.skillsync.mentorservice.service.MentorService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;

@RestController
@RequestMapping("/mentors")
public class MentorController {

    private final MentorService mentorService;

    public MentorController(MentorService mentorService) {
        this.mentorService = mentorService;
    }

    @PostMapping("/apply")
    @PreAuthorize("hasAnyAuthority('ROLE_LEARNER','ROLE_MENTOR')")
    public ResponseEntity<MentorResponse> apply(@Valid @RequestBody MentorApplyRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(mentorService.apply(request));
    }

    @GetMapping
    @PreAuthorize("hasAnyAuthority('ROLE_LEARNER','ROLE_MENTOR','ROLE_ADMIN')")
    public ResponseEntity<PageResponse<MentorResponse>> getAll(
            @RequestParam(name = "skillId", required = false) String skillId,
            @RequestParam(name = "rating", required = false) BigDecimal rating,
            @RequestParam(name = "experience", required = false) Integer experience,
            @RequestParam(name = "price", required = false) BigDecimal price,
            @RequestParam(name = "page", defaultValue = "0") int page,
            @RequestParam(name = "size", defaultValue = "10") int size,
            @RequestParam(name = "sortBy", defaultValue = "id") String sortBy,
            @RequestParam(name = "sortDir", defaultValue = "asc") String sortDir) {
        return ResponseEntity.ok(mentorService.getAll(skillId, rating, experience, price, page, size, sortBy, sortDir));
    }

    @GetMapping("/summary")
    @PreAuthorize("hasAnyAuthority('ROLE_LEARNER','ROLE_MENTOR','ROLE_ADMIN')")
    public ResponseEntity<MentorSummaryResponse> getSummary() {

        return ResponseEntity.ok(mentorService.getSummary());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('ROLE_LEARNER','ROLE_MENTOR','ROLE_ADMIN')")
    public ResponseEntity<MentorResponse> getById(@PathVariable("id") Long id) {
        return ResponseEntity.ok(mentorService.getById(id));
    }

    @PutMapping("/{id}/availability")
    @PreAuthorize("hasAuthority('ROLE_MENTOR')")
    public ResponseEntity<MentorResponse> updateAvailability(@PathVariable("id") Long id, @Valid @RequestBody MentorAvailabilityRequest request) {
        return ResponseEntity.ok(mentorService.updateAvailability(id, request));
    }

    @PutMapping("/{id}/approve")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<MentorResponse> approve(@PathVariable("id") Long id) {
        return ResponseEntity.ok(mentorService.approve(id));
    }

    @PutMapping("/{id}/reject")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<MentorResponse> reject(@PathVariable("id") Long id, @RequestBody(required = false) MentorStatusUpdateRequest request) {
        String reason = request == null ? null : request.getReason();
        return ResponseEntity.ok(mentorService.reject(id, reason));
    }

    @PutMapping("/internal/{id}/rating")
    public ResponseEntity<MentorResponse> updateAverageRating(@PathVariable("id") Long id, @Valid @RequestBody MentorRatingUpdateRequest request) {
        return ResponseEntity.ok(mentorService.updateAverageRating(id, request.getAverageRating()));
    }
}
