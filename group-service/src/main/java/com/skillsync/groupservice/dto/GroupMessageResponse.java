package com.skillsync.groupservice.dto;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class GroupMessageResponse {
    private Long id;
    private Long groupId;
    private Long userId;
    private String message;
    private LocalDateTime createdAt;
}
