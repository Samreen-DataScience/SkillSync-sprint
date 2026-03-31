package com.skillsync.authservice.dto;

import lombok.Builder;
import lombok.Data;

import java.util.Set;

@Data
@Builder
public class AuthResponse {
    private Long userId;
    private String name;
    private String email;
    private Set<String> roles;
    private String token;
    private String refreshToken;
    private long expiresIn;
}
