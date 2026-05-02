package com.skillsync.notificationservice.repository;

import com.skillsync.notificationservice.entity.Notification;
import com.skillsync.notificationservice.entity.NotificationStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface NotificationRepository extends JpaRepository<Notification, Long> {
    Page<Notification> findByUserId(Long userId, Pageable pageable);
    long countByUserIdAndStatus(Long userId, NotificationStatus status);
    long countByStatus(NotificationStatus status);
}
