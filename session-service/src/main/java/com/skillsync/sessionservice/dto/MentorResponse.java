package com.skillsync.sessionservice.dto;

import lombok.Data;

@Data
public class MentorResponse {
    private Long id;
    private Long userId;
    private String displayName;
    private String email;
}
