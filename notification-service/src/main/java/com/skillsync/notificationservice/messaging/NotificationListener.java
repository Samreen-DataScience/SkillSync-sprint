package com.skillsync.notificationservice.messaging;

import com.skillsync.notificationservice.entity.Notification;
import com.skillsync.notificationservice.repository.NotificationRepository;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

@Component
public class NotificationListener {

    private final NotificationRepository notificationRepository;

    public NotificationListener(NotificationRepository notificationRepository) {
        this.notificationRepository = notificationRepository;
    }

    @RabbitListener(queues = "skillsync.notification.queue")
    public void handleEvent(NotificationEvent event) {
        Notification notification = Notification.builder()
                .userId(event.getUserId())
                .eventType(event.getEventType())
                .message(event.getMessage())
                .build();
        notificationRepository.save(notification);
    }
}
