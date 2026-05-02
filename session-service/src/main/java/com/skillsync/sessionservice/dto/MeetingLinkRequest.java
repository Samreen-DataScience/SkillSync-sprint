package com.skillsync.sessionservice.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class MeetingLinkRequest {
    @NotBlank
    @Size(max = 500)
    private String meetingLink;
}
