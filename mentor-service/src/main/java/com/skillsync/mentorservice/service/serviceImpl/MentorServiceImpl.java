package com.skillsync.mentorservice.service.serviceImpl;

import com.skillsync.mentorservice.config.RabbitConfig;
import com.skillsync.mentorservice.dto.*;
import com.skillsync.mentorservice.entity.MentorAvailabilitySlot;
import com.skillsync.mentorservice.entity.MentorProfile;
import com.skillsync.mentorservice.entity.MentorStatus;
import com.skillsync.mentorservice.exception.BusinessException;
import com.skillsync.mentorservice.exception.DuplicateResourceException;
import com.skillsync.mentorservice.exception.ResourceNotFoundException;
import com.skillsync.mentorservice.messaging.NotificationEvent;
import com.skillsync.mentorservice.repository.MentorProfileRepository;
import com.skillsync.mentorservice.service.MentorService;
import org.modelmapper.ModelMapper;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeParseException;
import java.util.List;

@Service
@Transactional
public class MentorServiceImpl implements MentorService {

    private final MentorProfileRepository mentorProfileRepository;
    private final ModelMapper modelMapper;
    private final RabbitTemplate rabbitTemplate;

    public MentorServiceImpl(MentorProfileRepository mentorProfileRepository, ModelMapper modelMapper, RabbitTemplate rabbitTemplate) {
        this.mentorProfileRepository = mentorProfileRepository;
        this.modelMapper = modelMapper;
        this.rabbitTemplate = rabbitTemplate;
    }

    @Override
    public MentorResponse apply(MentorApplyRequest request) {
        if (mentorProfileRepository.existsByUserId(request.getUserId())) {
            throw new DuplicateResourceException("Mentor profile already exists for this user");
        }

        MentorProfile profile = modelMapper.map(request, MentorProfile.class);
        profile.setStatus(MentorStatus.PENDING);
        MentorProfile saved = mentorProfileRepository.save(profile);
        return toResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public MentorResponse getById(Long id) {
        return toResponse(getMentorOrThrow(id));
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<MentorResponse> getAll(String skillId, BigDecimal minRating, Integer minExperience, BigDecimal maxPrice, int page, int size, String sortBy, String sortDir) {
        Sort sort = sortDir.equalsIgnoreCase("desc") ? Sort.by(sortBy).descending() : Sort.by(sortBy).ascending();
        Specification<MentorProfile> spec = (root, query, cb) -> cb.equal(root.get("status"), MentorStatus.APPROVED);

        if (skillId != null && !skillId.isBlank()) {
            Long sid = Long.valueOf(skillId);
            spec = spec.and((root, query, cb) -> cb.isMember(sid, root.get("skillIds")));
        }
        if (minRating != null) {
            spec = spec.and((root, query, cb) -> cb.greaterThanOrEqualTo(root.get("averageRating"), minRating));
        }
        if (minExperience != null) {
            spec = spec.and((root, query, cb) -> cb.greaterThanOrEqualTo(root.get("experienceYears"), minExperience));
        }
        if (maxPrice != null) {
            spec = spec.and((root, query, cb) -> cb.lessThanOrEqualTo(root.get("hourlyRate"), maxPrice));
        }

        Page<MentorProfile> result = mentorProfileRepository.findAll(spec, PageRequest.of(page, size, sort));
        return PageResponse.<MentorResponse>builder()
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
    public MentorSummaryResponse getSummary() {
        return MentorSummaryResponse.builder()
                .totalMentors(mentorProfileRepository.count())
                .approvedMentors(mentorProfileRepository.countByStatus(MentorStatus.APPROVED))
                .pendingMentors(mentorProfileRepository.countByStatus(MentorStatus.PENDING))
                .rejectedMentors(mentorProfileRepository.countByStatus(MentorStatus.REJECTED))
                .build();
    }

    @Override
    public MentorResponse updateAvailability(Long id, MentorAvailabilityRequest request) {
        MentorProfile mentor = getMentorOrThrow(id);
        mentor.getAvailabilitySlots().clear();

        List<MentorAvailabilitySlot> newSlots = request.getSlots().stream().map(slot -> {
            try {
                LocalTime startTime = LocalTime.parse(slot.getStartTime());
                LocalTime endTime = LocalTime.parse(slot.getEndTime());
                if (!endTime.isAfter(startTime)) {
                    throw new BusinessException("End time must be after start time for every availability slot");
                }
                return MentorAvailabilitySlot.builder()
                        .dayOfWeek(slot.getDayOfWeek())
                        .startTime(startTime)
                        .endTime(endTime)
                        .available(slot.getAvailable())
                        .mentor(mentor)
                        .build();
            } catch (DateTimeParseException ex) {
                throw new BusinessException("Invalid time format. Use HH:mm for availability slots");
            }
        }).toList();

        mentor.getAvailabilitySlots().addAll(newSlots);
        return toResponse(mentorProfileRepository.save(mentor));
    }

    @Override
    public MentorResponse approve(Long id) {
        MentorProfile mentor = getMentorOrThrow(id);
        if (mentor.getStatus() == MentorStatus.APPROVED) {
            throw new BusinessException("Mentor is already approved");
        }
        mentor.setStatus(MentorStatus.APPROVED);
        MentorProfile saved = mentorProfileRepository.save(mentor);

        publishNotification(NotificationEvent.builder()
                .eventType("MENTOR_APPROVED")
                .userId(saved.getUserId())
                .message("Your mentor application has been approved")
                .eventTime(LocalDateTime.now())
                .build(), RabbitConfig.MENTOR_APPROVED_KEY);

        return toResponse(saved);
    }

    @Override
    public MentorResponse reject(Long id, String reason) {
        MentorProfile mentor = getMentorOrThrow(id);
        if (mentor.getStatus() == MentorStatus.REJECTED) {
            throw new BusinessException("Mentor is already rejected");
        }
        mentor.setStatus(MentorStatus.REJECTED);
        MentorProfile saved = mentorProfileRepository.save(mentor);

        publishNotification(NotificationEvent.builder()
                .eventType("MENTOR_REJECTED")
                .userId(saved.getUserId())
                .message(reason == null || reason.isBlank() ? "Mentor application rejected" : reason)
                .eventTime(LocalDateTime.now())
                .build(), "mentor.rejected");

        return toResponse(saved);
    }

    @Override
    public MentorResponse updateAverageRating(Long id, BigDecimal averageRating) {
        MentorProfile mentor = getMentorOrThrow(id);
        mentor.setAverageRating(averageRating == null ? BigDecimal.ZERO : averageRating);
        return toResponse(mentorProfileRepository.save(mentor));
    }

    private MentorProfile getMentorOrThrow(Long id) {
        return mentorProfileRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Mentor not found"));
    }

    private void publishNotification(NotificationEvent event, String routingKey) {
        try {
            rabbitTemplate.convertAndSend(RabbitConfig.EXCHANGE, routingKey, event);
        } catch (Exception ignored) {
        }
    }

    private MentorResponse toResponse(MentorProfile profile) {
        MentorResponse response = modelMapper.map(profile, MentorResponse.class);
        response.setStatus(profile.getStatus().name());
        response.setAvailabilitySlots(profile.getAvailabilitySlots().stream().map(slot -> {
            AvailabilitySlotDto dto = new AvailabilitySlotDto();
            dto.setDayOfWeek(slot.getDayOfWeek());
            dto.setStartTime(slot.getStartTime().toString());
            dto.setEndTime(slot.getEndTime().toString());
            dto.setAvailable(slot.isAvailable());
            return dto;
        }).toList());
        return response;
    }
}
