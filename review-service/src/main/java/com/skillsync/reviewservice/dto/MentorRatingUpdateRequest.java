package com.skillsync.reviewservice.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class MentorRatingUpdateRequest {
    @NotNull
    @DecimalMin("0.0")
    private BigDecimal averageRating;
}
