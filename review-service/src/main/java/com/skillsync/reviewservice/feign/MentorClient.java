package com.skillsync.reviewservice.feign;

import com.skillsync.reviewservice.dto.MentorRatingUpdateRequest;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;

@FeignClient(name = "mentor-service", fallback = MentorClientFallback.class)
public interface MentorClient {

    @PutMapping("/mentors/internal/{id}/rating")
    void updateAverageRating(@PathVariable("id") Long mentorId, @RequestBody MentorRatingUpdateRequest request);
}
