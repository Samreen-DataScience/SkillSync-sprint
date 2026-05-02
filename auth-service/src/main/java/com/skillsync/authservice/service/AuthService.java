package com.skillsync.authservice.service;

import com.skillsync.authservice.dto.*;

public interface AuthService {
    AuthResponse register(RegisterRequest request);
    AuthResponse login(LoginRequest request);
    AuthResponse refresh(RefreshTokenRequest request);
    UserSummaryResponse getUser(Long userId);
    void changePassword(String email, ChangePasswordRequest request);
}
