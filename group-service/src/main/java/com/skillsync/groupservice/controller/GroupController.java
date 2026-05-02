package com.skillsync.groupservice.controller;

import com.skillsync.groupservice.dto.*;
import com.skillsync.groupservice.service.GroupService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/groups")
public class GroupController {

    private final GroupService groupService;

    public GroupController(GroupService groupService) {
        this.groupService = groupService;
    }

    @PostMapping
    @PreAuthorize("hasAuthority('ROLE_MENTOR')")
    public ResponseEntity<GroupResponse> create(@Valid @RequestBody GroupCreateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(groupService.create(request));
    }

    @PostMapping("/{id}/join")
    @PreAuthorize("hasAnyAuthority('ROLE_LEARNER','ROLE_MENTOR')")
    public ResponseEntity<GroupResponse> join(@PathVariable("id") Long id, @RequestParam(name = "userId") Long userId) {
        return ResponseEntity.ok(groupService.join(id, userId));
    }

    @PostMapping("/{id}/leave")
    @PreAuthorize("hasAnyAuthority('ROLE_LEARNER','ROLE_MENTOR')")
    public ResponseEntity<GroupResponse> leave(@PathVariable("id") Long id, @RequestParam(name = "userId") Long userId) {
        return ResponseEntity.ok(groupService.leave(id, userId));
    }

    @GetMapping
    @PreAuthorize("hasAnyAuthority('ROLE_LEARNER','ROLE_MENTOR','ROLE_ADMIN')")
    public ResponseEntity<PageResponse<GroupResponse>> getAll(
            @RequestParam(name = "page", defaultValue = "0") int page,
            @RequestParam(name = "size", defaultValue = "10") int size,
            @RequestParam(name = "sortBy", defaultValue = "id") String sortBy,
            @RequestParam(name = "sortDir", defaultValue = "asc") String sortDir) {
        return ResponseEntity.ok(groupService.getAll(page, size, sortBy, sortDir));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('ROLE_LEARNER','ROLE_MENTOR','ROLE_ADMIN')")
    public ResponseEntity<GroupResponse> getById(@PathVariable("id") Long id) {
        return ResponseEntity.ok(groupService.getById(id));
    }

    @GetMapping("/{id}/members")
    @PreAuthorize("hasAnyAuthority('ROLE_LEARNER','ROLE_MENTOR','ROLE_ADMIN')")
    public ResponseEntity<List<GroupMemberResponse>> getMembers(@PathVariable("id") Long id) {
        return ResponseEntity.ok(groupService.getMembers(id));
    }

    @PostMapping("/{id}/messages")
    @PreAuthorize("hasAnyAuthority('ROLE_LEARNER','ROLE_MENTOR')")
    public ResponseEntity<GroupMessageResponse> addMessage(@PathVariable("id") Long id, @Valid @RequestBody GroupMessageRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(groupService.addDiscussion(id, request));
    }

    @GetMapping("/{id}/messages")
    @PreAuthorize("hasAnyAuthority('ROLE_LEARNER','ROLE_MENTOR','ROLE_ADMIN')")
    public ResponseEntity<PageResponse<GroupMessageResponse>> getMessages(
            @PathVariable("id") Long id,
            @RequestParam(name = "page", defaultValue = "0") int page,
            @RequestParam(name = "size", defaultValue = "10") int size,
            @RequestParam(name = "sortBy", defaultValue = "createdAt") String sortBy,
            @RequestParam(name = "sortDir", defaultValue = "desc") String sortDir) {
        return ResponseEntity.ok(groupService.getDiscussions(id, page, size, sortBy, sortDir));
    }
}
