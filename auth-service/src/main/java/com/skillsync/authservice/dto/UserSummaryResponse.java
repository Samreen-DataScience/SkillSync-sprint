package com.skillsync.authservice.dto;

import lombok.Builder;
import lombok.Data;

import java.util.Set;

@Data
@Builder
public class UserSummaryResponse {
    private Long userId;
    private String name;
    private String email;
    private Set<String> roles;
}
