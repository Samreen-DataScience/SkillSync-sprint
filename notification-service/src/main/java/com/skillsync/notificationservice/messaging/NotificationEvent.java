package com.skillsync.notificationservice.messaging;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class NotificationEvent {
    private String eventType;
    private Long userId;
    private String message;
    private LocalDateTime eventTime;
    private Long sessionId;
    private Long mentorId;
    private Long learnerId;
}
