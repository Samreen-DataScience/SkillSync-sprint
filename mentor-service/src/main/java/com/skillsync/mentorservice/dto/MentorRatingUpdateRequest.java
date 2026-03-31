package com.skillsync.mentorservice.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class MentorRatingUpdateRequest {
    @NotNull
    @DecimalMin("0.0")
    private BigDecimal averageRating;
}
