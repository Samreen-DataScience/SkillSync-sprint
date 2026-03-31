package com.skillsync.notificationservice.controller;

import com.skillsync.notificationservice.dto.NotificationCountResponse;
import com.skillsync.notificationservice.dto.NotificationResponse;
import com.skillsync.notificationservice.dto.PageResponse;
import com.skillsync.notificationservice.service.NotificationService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/notifications")
public class NotificationController {

    private final NotificationService notificationService;

    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @GetMapping("/user/{userId}")
    @PreAuthorize("hasAnyAuthority('ROLE_LEARNER','ROLE_MENTOR','ROLE_ADMIN')")
    public ResponseEntity<PageResponse<NotificationResponse>> getUserNotifications(
            @PathVariable("userId") Long userId,
            @RequestParam(name = "page", defaultValue = "0") int page,
            @RequestParam(name = "size", defaultValue = "10") int size,
            @RequestParam(name = "sortBy", defaultValue = "createdAt") String sortBy,
            @RequestParam(name = "sortDir", defaultValue = "desc") String sortDir) {
        return ResponseEntity.ok(notificationService.getByUserId(userId, page, size, sortBy, sortDir));
    }

    @GetMapping("/user/{userId}/unread-count")
    @PreAuthorize("hasAnyAuthority('ROLE_LEARNER','ROLE_MENTOR','ROLE_ADMIN')")
    public ResponseEntity<NotificationCountResponse> getUnreadCount(@PathVariable("userId") Long userId) {
        return ResponseEntity.ok(notificationService.getUnreadCount(userId));
    }

    @PutMapping("/{id}/read")
    @PreAuthorize("hasAnyAuthority('ROLE_LEARNER','ROLE_MENTOR','ROLE_ADMIN')")
    public ResponseEntity<NotificationResponse> markRead(@PathVariable("id") Long id) {
        return ResponseEntity.ok(notificationService.markRead(id));
    }
}
