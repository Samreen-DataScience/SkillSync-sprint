package com.skillsync.sessionservice.dto;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class SessionRequest {
    @NotNull
    private Long mentorId;

    @NotNull
    private Long learnerId;

    @NotNull
    @Future
    private LocalDateTime sessionDateTime;

    @NotNull
    @Min(15)
    private Integer durationMinutes;

    @NotBlank
    private String topic;
}
