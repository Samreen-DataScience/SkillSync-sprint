package com.skillsync.mentorservice.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class AvailabilitySlotDto {
    @NotBlank
    private String dayOfWeek;
    @NotBlank
    private String startTime;
    @NotBlank
    private String endTime;
    @NotNull
    private Boolean available;
}
