package com.skillsync.mentorservice.dto;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;

@Data
public class MentorResponse {
    private Long id;
    private Long userId;
    private String displayName;
    private String email;
    private String bio;
    private Integer experienceYears;
    private BigDecimal hourlyRate;
    private BigDecimal averageRating;
    private String status;
    private Set<Long> skillIds;
    private List<AvailabilitySlotDto> availabilitySlots;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
