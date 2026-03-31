package com.skillsync.mentorservice.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MentorSummaryResponse {
    private long totalMentors;
    private long approvedMentors;
    private long pendingMentors;
    private long rejectedMentors;
}
