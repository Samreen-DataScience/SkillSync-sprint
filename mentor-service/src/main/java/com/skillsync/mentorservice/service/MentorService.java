package com.skillsync.mentorservice.service;

import com.skillsync.mentorservice.dto.MentorApplyRequest;
import com.skillsync.mentorservice.dto.MentorAvailabilityRequest;
import com.skillsync.mentorservice.dto.MentorResponse;
import com.skillsync.mentorservice.dto.MentorSummaryResponse;
import com.skillsync.mentorservice.dto.PageResponse;

import java.math.BigDecimal;

public interface MentorService {
    MentorResponse apply(MentorApplyRequest request);
    MentorResponse getById(Long id);
    PageResponse<MentorResponse> getAll(String skillId, BigDecimal minRating, Integer minExperience, BigDecimal maxPrice, int page, int size, String sortBy, String sortDir);
    MentorResponse updateAvailability(Long id, MentorAvailabilityRequest request);
    MentorResponse approve(Long id);
    MentorResponse reject(Long id, String reason);
    MentorResponse updateAverageRating(Long id, BigDecimal averageRating);
    MentorSummaryResponse getSummary();
}
