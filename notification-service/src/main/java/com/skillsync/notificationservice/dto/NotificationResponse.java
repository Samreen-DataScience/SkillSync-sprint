package com.skillsync.notificationservice.dto;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class NotificationResponse {
    private Long id;
    private Long userId;
    private String eventType;
    private String message;
    private String status;
    private LocalDateTime createdAt;
}
