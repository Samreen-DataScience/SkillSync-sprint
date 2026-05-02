package com.skillsync.mentorservice.dto;

import jakarta.validation.constraints.*;
import lombok.Data;

import java.math.BigDecimal;
import java.util.Set;

@Data
public class MentorApplyRequest {
    @NotNull
    private Long userId;

    @Size(max = 100)
    private String displayName;

    @Email
    @Size(max = 150)
    private String email;

    @NotBlank
    @Size(max = 2000)
    private String bio;

    @NotNull
    @Min(0)
    private Integer experienceYears;

    @NotNull
    @DecimalMin("0.0")
    private BigDecimal hourlyRate;

    @NotEmpty
    private Set<Long> skillIds;
}
