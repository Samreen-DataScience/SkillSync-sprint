package com.skillsync.sessionservice.dto;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class SessionResponse {
    private Long id;
    private Long mentorId;
    private Long learnerId;
    private LocalDateTime sessionDateTime;
    private Integer durationMinutes;
    private String topic;
    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
