package com.skillsync.mentorservice.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import lombok.Data;

import java.util.List;

@Data
public class MentorAvailabilityRequest {
    @Valid
    @NotEmpty
    private List<AvailabilitySlotDto> slots;
}
