package com.skillsync.sessionservice.controller;

import com.skillsync.sessionservice.dto.PageResponse;
import com.skillsync.sessionservice.dto.MeetingLinkRequest;
import com.skillsync.sessionservice.dto.SessionRequest;
import com.skillsync.sessionservice.dto.SessionResponse;
import com.skillsync.sessionservice.dto.SessionSummaryResponse;
import com.skillsync.sessionservice.service.SessionService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/sessions")
public class SessionController {

    private final SessionService sessionService;

    public SessionController(SessionService sessionService) {
        this.sessionService = sessionService;
    }

    @PostMapping
    @PreAuthorize("hasAuthority('ROLE_LEARNER')")
    public ResponseEntity<SessionResponse> create(@Valid @RequestBody SessionRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(sessionService.requestSession(request));
    }

    @PutMapping("/{id}/accept")
    @PreAuthorize("hasAuthority('ROLE_MENTOR')")
    public ResponseEntity<SessionResponse> accept(@PathVariable("id") Long id) {
        return ResponseEntity.ok(sessionService.accept(id));
    }

    @PutMapping("/{id}/reject")
    @PreAuthorize("hasAuthority('ROLE_MENTOR')")
    public ResponseEntity<SessionResponse> reject(@PathVariable("id") Long id) {
        return ResponseEntity.ok(sessionService.reject(id));
    }

    @PutMapping("/{id}/cancel")
    @PreAuthorize("hasAnyAuthority('ROLE_LEARNER','ROLE_MENTOR')")
    public ResponseEntity<SessionResponse> cancel(@PathVariable("id") Long id) {
        return ResponseEntity.ok(sessionService.cancel(id));
    }

    @PutMapping("/{id}/complete")
    @PreAuthorize("hasAuthority('ROLE_MENTOR')")
    public ResponseEntity<SessionResponse> complete(@PathVariable("id") Long id) {
        return ResponseEntity.ok(sessionService.complete(id));
    }

    @PutMapping("/{id}/meeting-link")
    @PreAuthorize("hasAuthority('ROLE_MENTOR')")
    public ResponseEntity<SessionResponse> updateMeetingLink(
            @PathVariable("id") Long id,
            @Valid @RequestBody MeetingLinkRequest request) {
        return ResponseEntity.ok(sessionService.updateMeetingLink(id, request.getMeetingLink()));
    }

    @GetMapping
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<PageResponse<SessionResponse>> getAll(
            @RequestParam(name = "page", defaultValue = "0") int page,
            @RequestParam(name = "size", defaultValue = "50") int size,
            @RequestParam(name = "sortBy", defaultValue = "id") String sortBy,
            @RequestParam(name = "sortDir", defaultValue = "desc") String sortDir) {
        return ResponseEntity.ok(sessionService.getAll(page, size, sortBy, sortDir));
    }

    @GetMapping("/user/{userId}")
    @PreAuthorize("hasAnyAuthority('ROLE_LEARNER','ROLE_MENTOR','ROLE_ADMIN')")
    public ResponseEntity<PageResponse<SessionResponse>> getByUser(
            @PathVariable("userId") Long userId,
            @RequestParam(name = "page", defaultValue = "0") int page,
            @RequestParam(name = "size", defaultValue = "10") int size,
            @RequestParam(name = "sortBy", defaultValue = "id") String sortBy,
            @RequestParam(name = "sortDir", defaultValue = "asc") String sortDir) {
        return ResponseEntity.ok(sessionService.getByUserId(userId, page, size, sortBy, sortDir));
    }

    @GetMapping("/mentor/{mentorId}")
    @PreAuthorize("hasAnyAuthority('ROLE_MENTOR','ROLE_ADMIN')")
    public ResponseEntity<PageResponse<SessionResponse>> getByMentor(
            @PathVariable("mentorId") Long mentorId,
            @RequestParam(name = "page", defaultValue = "0") int page,
            @RequestParam(name = "size", defaultValue = "10") int size,
            @RequestParam(name = "sortBy", defaultValue = "id") String sortBy,
            @RequestParam(name = "sortDir", defaultValue = "asc") String sortDir) {
        return ResponseEntity.ok(sessionService.getByMentorId(mentorId, page, size, sortBy, sortDir));
    }

    @GetMapping("/user/{userId}/summary")
    @PreAuthorize("hasAnyAuthority('ROLE_LEARNER','ROLE_MENTOR','ROLE_ADMIN')")
    public ResponseEntity<SessionSummaryResponse> getSummary(@PathVariable("userId") Long userId) {
        return ResponseEntity.ok(sessionService.getSummaryByUserId(userId));
    }
}
