package com.skillsync.reviewservice.feign;

import com.skillsync.reviewservice.dto.MentorRatingUpdateRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

@Component
public class MentorClientFallback implements MentorClient {

    private static final Logger log = LoggerFactory.getLogger(MentorClientFallback.class);

    @Override
    public void updateAverageRating(Long mentorId, MentorRatingUpdateRequest request) {
        log.warn("Mentor-service is unavailable. Skipping average rating update for mentorId={}", mentorId);
    }
}
