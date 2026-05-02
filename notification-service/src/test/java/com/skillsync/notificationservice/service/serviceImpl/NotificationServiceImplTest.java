package com.skillsync.notificationservice.service.serviceImpl;

import com.skillsync.notificationservice.dto.NotificationResponse;
import com.skillsync.notificationservice.dto.PageResponse;
import com.skillsync.notificationservice.entity.Notification;
import com.skillsync.notificationservice.entity.NotificationStatus;
import com.skillsync.notificationservice.repository.NotificationRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.modelmapper.ModelMapper;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class NotificationServiceImplTest {

    @Mock
    private NotificationRepository notificationRepository;

    @Mock
    private ModelMapper modelMapper;

    @InjectMocks
    private NotificationServiceImpl notificationService;

    @Test
    void getByUserIdShouldReturnPagedNotifications() {
        Notification notification = Notification.builder().id(1L).userId(3L).message("New message").status(NotificationStatus.SENT).build();
        NotificationResponse mapped = new NotificationResponse();
        mapped.setId(1L);
        mapped.setUserId(3L);
        mapped.setMessage("New message");

        when(notificationRepository.findByUserId(3L, PageRequest.of(0, 10, org.springframework.data.domain.Sort.by("id").ascending())))
                .thenReturn(new PageImpl<>(List.of(notification), PageRequest.of(0, 10), 1));
        when(modelMapper.map(notification, NotificationResponse.class)).thenReturn(mapped);

        PageResponse<NotificationResponse> response = notificationService.getByUserId(3L, 0, 10, "id", "asc");

        assertEquals(1, response.getContent().size());
        assertEquals("SENT", response.getContent().get(0).getStatus());
    }

    @Test
    void getAllShouldReturnPagedNotificationsForAdmin() {
        Notification notification = Notification.builder().id(3L).userId(1L).message("Session completed").status(NotificationStatus.SENT).build();
        NotificationResponse mapped = new NotificationResponse();
        mapped.setId(3L);

        when(notificationRepository.findAll(PageRequest.of(0, 10, org.springframework.data.domain.Sort.by("id").descending())))
                .thenReturn(new PageImpl<>(List.of(notification), PageRequest.of(0, 10), 1));
        when(modelMapper.map(notification, NotificationResponse.class)).thenReturn(mapped);

        PageResponse<NotificationResponse> response = notificationService.getAll(0, 10, "id", "desc");

        assertEquals(1, response.getContent().size());
        assertEquals("SENT", response.getContent().get(0).getStatus());
    }

    @Test
    void markReadShouldUpdateNotificationStatus() {
        Notification notification = Notification.builder().id(2L).userId(4L).message("Session accepted").status(NotificationStatus.SENT).build();
        Notification saved = Notification.builder().id(2L).userId(4L).message("Session accepted").status(NotificationStatus.READ).build();
        NotificationResponse mapped = new NotificationResponse();
        mapped.setId(2L);

        when(notificationRepository.findById(2L)).thenReturn(Optional.of(notification));
        when(notificationRepository.save(any(Notification.class))).thenReturn(saved);
        when(modelMapper.map(saved, NotificationResponse.class)).thenReturn(mapped);

        NotificationResponse response = notificationService.markRead(2L);

        assertEquals("READ", response.getStatus());
        verify(notificationRepository).save(any(Notification.class));
    }
}
