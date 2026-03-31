package com.skillsync.reviewservice.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class RatingSummaryResponse {
    private Long mentorId;
    private Double averageRating;
}
