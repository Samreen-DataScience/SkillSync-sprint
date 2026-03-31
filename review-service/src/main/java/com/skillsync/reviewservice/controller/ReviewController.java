package com.skillsync.reviewservice.controller;

import com.skillsync.reviewservice.dto.*;
import com.skillsync.reviewservice.service.ReviewService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/reviews")
public class ReviewController {

    private final ReviewService reviewService;

    public ReviewController(ReviewService reviewService) {
        this.reviewService = reviewService;
    }

    @PostMapping
    @PreAuthorize("hasAuthority('ROLE_LEARNER')")
    public ResponseEntity<ReviewResponse> create(@Valid @RequestBody ReviewRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(reviewService.create(request));
    }

    @GetMapping("/mentor/{mentorId}")
    @PreAuthorize("hasAnyAuthority('ROLE_LEARNER','ROLE_MENTOR','ROLE_ADMIN')")
    public ResponseEntity<PageResponse<ReviewResponse>> getByMentor(
            @PathVariable("mentorId") Long mentorId,
            @RequestParam(name = "page", defaultValue = "0") int page,
            @RequestParam(name = "size", defaultValue = "10") int size,
            @RequestParam(name = "sortBy", defaultValue = "createdAt") String sortBy,
            @RequestParam(name = "sortDir", defaultValue = "desc") String sortDir) {
        return ResponseEntity.ok(reviewService.getByMentorId(mentorId, page, size, sortBy, sortDir));
    }

    @GetMapping("/mentor/{mentorId}/average")
    @PreAuthorize("hasAnyAuthority('ROLE_LEARNER','ROLE_MENTOR','ROLE_ADMIN')")
    public ResponseEntity<RatingSummaryResponse> getAverage(@PathVariable("mentorId") Long mentorId) {
        return ResponseEntity.ok(reviewService.getAverageRating(mentorId));
    }
}



