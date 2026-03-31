package com.skillsync.sessionservice.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SessionSummaryResponse {
    private Long userId;
    private long totalSessions;
    private long requestedSessions;
    private long acceptedSessions;
    private long rejectedSessions;
    private long completedSessions;
    private long cancelledSessions;
}
