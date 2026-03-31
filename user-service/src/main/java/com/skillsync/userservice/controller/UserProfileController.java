package com.skillsync.userservice.controller;

import com.skillsync.userservice.dto.PageResponse;
import com.skillsync.userservice.dto.UserProfileRequest;
import com.skillsync.userservice.dto.UserProfileResponse;
import com.skillsync.userservice.service.UserProfileService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/users")
public class UserProfileController {

    private final UserProfileService userProfileService;

    public UserProfileController(UserProfileService userProfileService) {
        this.userProfileService = userProfileService;
    }

    @PostMapping
    @PreAuthorize("hasAnyAuthority('ROLE_LEARNER','ROLE_MENTOR','ROLE_ADMIN')")
    public ResponseEntity<UserProfileResponse> create(@Valid @RequestBody UserProfileRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(userProfileService.create(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('ROLE_LEARNER','ROLE_MENTOR','ROLE_ADMIN')")
    public ResponseEntity<UserProfileResponse> update(@PathVariable("id") Long id, @Valid @RequestBody UserProfileRequest request) {
        return ResponseEntity.ok(userProfileService.update(id, request));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('ROLE_LEARNER','ROLE_MENTOR','ROLE_ADMIN')")
    public ResponseEntity<UserProfileResponse> getById(@PathVariable("id") Long id) {
        return ResponseEntity.ok(userProfileService.getById(id));
    }

    @GetMapping
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<PageResponse<UserProfileResponse>> getAll(
            @RequestParam(name = "page", defaultValue = "0") int page,
            @RequestParam(name = "size", defaultValue = "10") int size,
            @RequestParam(name = "sortBy", defaultValue = "id") String sortBy,
            @RequestParam(name = "sortDir", defaultValue = "asc") String sortDir) {
        return ResponseEntity.ok(userProfileService.getAll(page, size, sortBy, sortDir));
    }
}


