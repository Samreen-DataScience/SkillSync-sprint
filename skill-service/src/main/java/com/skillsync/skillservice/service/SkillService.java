package com.skillsync.skillservice.service;

import com.skillsync.skillservice.dto.PageResponse;
import com.skillsync.skillservice.dto.SkillRequest;
import com.skillsync.skillservice.dto.SkillResponse;

public interface SkillService {
    SkillResponse create(SkillRequest request);
    SkillResponse getById(Long id);
    PageResponse<SkillResponse> getAll(int page, int size, String sortBy, String sortDir);
}
