package com.skillsync.reviewservice.messaging;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class NotificationEvent {
    private String eventType;
    private Long userId;
    private String message;
    private LocalDateTime eventTime;
    private Long sessionId;
    private Long mentorId;
    private Long learnerId;
}
