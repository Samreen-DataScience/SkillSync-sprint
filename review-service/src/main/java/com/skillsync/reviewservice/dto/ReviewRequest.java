package com.skillsync.reviewservice.dto;

import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class ReviewRequest {
    @NotNull
    private Long mentorId;

    @NotNull
    private Long userId;

    @NotNull
    private Long sessionId;

    @NotNull
    @Min(1)
    @Max(5)
    private Integer rating;

    @Size(max = 1500)
    private String comment;
}
