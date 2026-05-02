package com.skillsync.reviewservice.feign;

import com.skillsync.reviewservice.dto.MentorRatingUpdateRequest;
import com.skillsync.reviewservice.dto.MentorResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;

@FeignClient(name = "mentor-service", fallback = MentorClientFallback.class)
public interface MentorClient {

    @GetMapping("/mentors/{id}")
    MentorResponse getById(@PathVariable("id") Long mentorId);

    @PutMapping("/mentors/internal/{id}/rating")
    void updateAverageRating(@PathVariable("id") Long mentorId, @RequestBody MentorRatingUpdateRequest request);
}
