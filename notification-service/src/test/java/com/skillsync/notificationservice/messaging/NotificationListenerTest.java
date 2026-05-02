package com.skillsync.notificationservice.messaging;

import com.skillsync.notificationservice.repository.NotificationRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class NotificationListenerTest {

    @Mock
    private NotificationRepository notificationRepository;

    private NotificationListener listener;

    @BeforeEach
    void setUp() {
        listener = new NotificationListener(notificationRepository);
    }

    @Test
    void handleEventSavesNotification() {
        NotificationEvent event = new NotificationEvent();
        event.setUserId(1L);
        event.setEventType("SESSION_BOOKED");
        event.setMessage("Session booked");

        listener.handleEvent(event);

        verify(notificationRepository).save(any());
    }
}
