package com.skillsync.sessionservice.feign;

import com.skillsync.sessionservice.dto.MentorResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@FeignClient(name = "mentor-service", fallback = MentorClientFallback.class)
public interface MentorClient {
    @GetMapping("/mentors/{id}")
    MentorResponse getById(@PathVariable("id") Long id);
}
