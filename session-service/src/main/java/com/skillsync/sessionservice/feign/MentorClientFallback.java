package com.skillsync.sessionservice.feign;

import com.skillsync.sessionservice.dto.MentorResponse;
import org.springframework.stereotype.Component;

@Component
public class MentorClientFallback implements MentorClient {
    @Override
    public MentorResponse getById(Long id) {
        return null;
    }
}
