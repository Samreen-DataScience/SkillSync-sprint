package com.skillsync.skillservice.controller;

import com.skillsync.skillservice.dto.PageResponse;
import com.skillsync.skillservice.dto.SkillRequest;
import com.skillsync.skillservice.dto.SkillResponse;
import com.skillsync.skillservice.service.SkillService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/skills")
public class SkillController {

    private final SkillService skillService;

    public SkillController(SkillService skillService) {
        this.skillService = skillService;
    }

    @PostMapping
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<SkillResponse> create(@Valid @RequestBody SkillRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(skillService.create(request));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('ROLE_LEARNER','ROLE_MENTOR','ROLE_ADMIN')")
    public ResponseEntity<SkillResponse> getById(@PathVariable("id") Long id) {
        return ResponseEntity.ok(skillService.getById(id));
    }

    @GetMapping
    @PreAuthorize("hasAnyAuthority('ROLE_LEARNER','ROLE_MENTOR','ROLE_ADMIN')")
    public ResponseEntity<PageResponse<SkillResponse>> getAll(
            @RequestParam(name = "page", defaultValue = "0") int page,
            @RequestParam(name = "size", defaultValue = "10") int size,
            @RequestParam(name = "sortBy", defaultValue = "id") String sortBy,
            @RequestParam(name = "sortDir", defaultValue = "asc") String sortDir) {
        return ResponseEntity.ok(skillService.getAll(page, size, sortBy, sortDir));
    }
}


