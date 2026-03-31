package com.skillsync.groupservice.dto;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class GroupResponse {
    private Long id;
    private String name;
    private String description;
    private Long createdBy;
    private long memberCount;
    private LocalDateTime createdAt;
}
