package com.skillsync.sessionservice.messaging;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationEvent {
    private String eventType;
    private Long userId;
    private String message;
    private LocalDateTime eventTime;
    private Long sessionId;
    private Long mentorId;
    private Long learnerId;
}
