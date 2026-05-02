package com.skillsync.notificationservice.controller;

import com.skillsync.notificationservice.dto.NotificationCountResponse;
import com.skillsync.notificationservice.dto.NotificationResponse;
import com.skillsync.notificationservice.dto.PageResponse;
import com.skillsync.notificationservice.service.NotificationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class NotificationControllerTest {

    @Mock
    private NotificationService notificationService;

    private NotificationController controller;

    @BeforeEach
    void setUp() {
        controller = new NotificationController(notificationService);
    }

    @Test
    void getUserNotificationsReturnsPage() {
        PageResponse<NotificationResponse> page = PageResponse.<NotificationResponse>builder().content(List.of()).build();
        when(notificationService.getByUserId(1L, 0, 10, "createdAt", "desc")).thenReturn(page);

        var response = controller.getUserNotifications(1L, 0, 10, "createdAt", "desc");

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(page, response.getBody());
    }

    @Test
    void getUnreadCountReturnsValue() {
        NotificationCountResponse count = new NotificationCountResponse(1L, 2L);
        when(notificationService.getUnreadCount(1L)).thenReturn(count);

        var response = controller.getUnreadCount(1L);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(count, response.getBody());
    }

    @Test
    void markReadReturnsNotification() {
        NotificationResponse notification = new NotificationResponse();
        when(notificationService.markRead(10L)).thenReturn(notification);

        var response = controller.markRead(10L);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(notification, response.getBody());
    }
}
