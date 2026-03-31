package com.skillsync.userservice.service;

import com.skillsync.userservice.dto.PageResponse;
import com.skillsync.userservice.dto.UserProfileRequest;
import com.skillsync.userservice.dto.UserProfileResponse;

public interface UserProfileService {
    UserProfileResponse create(UserProfileRequest request);
    UserProfileResponse update(Long id, UserProfileRequest request);
    UserProfileResponse getById(Long id);
    PageResponse<UserProfileResponse> getAll(int page, int size, String sortBy, String sortDir);
}
