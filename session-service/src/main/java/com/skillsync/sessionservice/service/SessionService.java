package com.skillsync.sessionservice.service;

import com.skillsync.sessionservice.dto.PageResponse;
import com.skillsync.sessionservice.dto.SessionRequest;
import com.skillsync.sessionservice.dto.SessionResponse;
import com.skillsync.sessionservice.dto.SessionSummaryResponse;

public interface SessionService {
    SessionResponse requestSession(SessionRequest request);
    SessionResponse accept(Long id);
    SessionResponse reject(Long id);
    SessionResponse cancel(Long id);
    SessionResponse complete(Long id);
    PageResponse<SessionResponse> getByUserId(Long userId, int page, int size, String sortBy, String sortDir);
    SessionSummaryResponse getSummaryByUserId(Long userId);
}
