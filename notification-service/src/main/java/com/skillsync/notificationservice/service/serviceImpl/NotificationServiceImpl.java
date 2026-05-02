package com.skillsync.notificationservice.service.serviceImpl;

import com.skillsync.notificationservice.dto.NotificationCountResponse;
import com.skillsync.notificationservice.dto.NotificationResponse;
import com.skillsync.notificationservice.dto.PageResponse;
import com.skillsync.notificationservice.entity.Notification;
import com.skillsync.notificationservice.entity.NotificationStatus;
import com.skillsync.notificationservice.exception.ResourceNotFoundException;
import com.skillsync.notificationservice.repository.NotificationRepository;
import com.skillsync.notificationservice.service.NotificationService;
import org.modelmapper.ModelMapper;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class NotificationServiceImpl implements NotificationService {

    private final NotificationRepository notificationRepository;
    private final ModelMapper modelMapper;

    public NotificationServiceImpl(NotificationRepository notificationRepository, ModelMapper modelMapper) {
        this.notificationRepository = notificationRepository;
        this.modelMapper = modelMapper;
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<NotificationResponse> getAll(int page, int size, String sortBy, String sortDir) {
        Sort sort = sortDir.equalsIgnoreCase("desc") ? Sort.by(sortBy).descending() : Sort.by(sortBy).ascending();
        Page<Notification> result = notificationRepository.findAll(PageRequest.of(page, size, sort));
        return PageResponse.<NotificationResponse>builder()
                .content(result.getContent().stream().map(this::toResponse).toList())
                .page(result.getNumber())
                .size(result.getSize())
                .totalElements(result.getTotalElements())
                .totalPages(result.getTotalPages())
                .last(result.isLast())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<NotificationResponse> getByUserId(Long userId, int page, int size, String sortBy, String sortDir) {
        Sort sort = sortDir.equalsIgnoreCase("desc") ? Sort.by(sortBy).descending() : Sort.by(sortBy).ascending();
        Page<Notification> result = notificationRepository.findByUserId(userId, PageRequest.of(page, size, sort));
        return PageResponse.<NotificationResponse>builder()
                .content(result.getContent().stream().map(this::toResponse).toList())
                .page(result.getNumber())
                .size(result.getSize())
                .totalElements(result.getTotalElements())
                .totalPages(result.getTotalPages())
                .last(result.isLast())
                .build();
    }

    @Override
    public NotificationResponse markRead(Long id) {
        Notification notification = notificationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Notification not found"));
        notification.setStatus(NotificationStatus.READ);
        return toResponse(notificationRepository.save(notification));
    }

    @Override
    @Transactional(readOnly = true)
    public NotificationCountResponse getUnreadCount(Long userId) {
        return NotificationCountResponse.builder()
                .userId(userId)
                .unreadCount(notificationRepository.countByUserIdAndStatus(userId, NotificationStatus.SENT))
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public NotificationCountResponse getUnreadCountForAdmin() {
        return NotificationCountResponse.builder()
                .userId(null)
                .unreadCount(notificationRepository.countByStatus(NotificationStatus.SENT))
                .build();
    }

    private NotificationResponse toResponse(Notification notification) {
        NotificationResponse response = modelMapper.map(notification, NotificationResponse.class);
        response.setStatus(notification.getStatus().name());
        return response;
    }
}
