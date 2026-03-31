package com.skillsync.reviewservice.service;

import com.skillsync.reviewservice.dto.*;

public interface ReviewService {
    ReviewResponse create(ReviewRequest request);
    PageResponse<ReviewResponse> getByMentorId(Long mentorId, int page, int size, String sortBy, String sortDir);
    RatingSummaryResponse getAverageRating(Long mentorId);
}
