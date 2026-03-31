package com.skillsync.userservice.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.Set;

@Data
public class UserProfileRequest {
    @NotNull
    private Long authUserId;

    @NotBlank
    @Size(max = 100)
    private String fullName;

    @NotBlank
    @Email
    private String email;

    @Size(max = 500)
    private String bio;

    @Size(max = 100)
    private String professionalTitle;

    private String profileImageUrl;

    private Set<String> skills;
}
