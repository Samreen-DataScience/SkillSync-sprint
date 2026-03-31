package com.skillsync.reviewservice.dto;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class ReviewResponse {
    private Long id;
    private Long mentorId;
    private Long userId;
    private Long sessionId;
    private Integer rating;
    private String comment;
    private LocalDateTime createdAt;
}
