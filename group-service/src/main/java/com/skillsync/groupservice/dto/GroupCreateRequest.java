package com.skillsync.groupservice.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class GroupCreateRequest {
    @NotBlank
    @Size(max = 150)
    private String name;

    @Size(max = 1500)
    private String description;

    @NotNull
    private Long createdBy;
}
