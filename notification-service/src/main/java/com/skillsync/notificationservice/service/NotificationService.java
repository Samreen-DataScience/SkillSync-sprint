package com.skillsync.notificationservice.service;

import com.skillsync.notificationservice.dto.NotificationCountResponse;
import com.skillsync.notificationservice.dto.NotificationResponse;
import com.skillsync.notificationservice.dto.PageResponse;

public interface NotificationService {
    PageResponse<NotificationResponse> getAll(int page, int size, String sortBy, String sortDir);
    PageResponse<NotificationResponse> getByUserId(Long userId, int page, int size, String sortBy, String sortDir);
    NotificationResponse markRead(Long id);
    NotificationCountResponse getUnreadCount(Long userId);
    NotificationCountResponse getUnreadCountForAdmin();
}
