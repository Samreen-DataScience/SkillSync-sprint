package com.skillsync.userservice.dto;

import lombok.Data;

import java.time.LocalDateTime;
import java.util.Set;

@Data
public class UserProfileResponse {
    private Long id;
    private Long authUserId;
    private String fullName;
    private String email;
    private String bio;
    private String professionalTitle;
    private String profileImageUrl;
    private Set<String> skills;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
