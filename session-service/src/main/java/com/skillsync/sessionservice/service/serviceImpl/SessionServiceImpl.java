package com.skillsync.sessionservice.service.serviceImpl;

import com.skillsync.sessionservice.config.RabbitConfig;
import com.skillsync.sessionservice.dto.PageResponse;
import com.skillsync.sessionservice.dto.MentorResponse;
import com.skillsync.sessionservice.dto.SessionRequest;
import com.skillsync.sessionservice.dto.SessionResponse;
import com.skillsync.sessionservice.dto.SessionSummaryResponse;
import com.skillsync.sessionservice.entity.MentorshipSession;
import com.skillsync.sessionservice.entity.SessionStatus;
import com.skillsync.sessionservice.exception.BusinessException;
import com.skillsync.sessionservice.exception.ResourceNotFoundException;
import com.skillsync.sessionservice.feign.MentorClient;
import com.skillsync.sessionservice.messaging.NotificationEvent;
import com.skillsync.sessionservice.repository.MentorshipSessionRepository;
import com.skillsync.sessionservice.service.SessionService;
import org.modelmapper.ModelMapper;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@Transactional
public class SessionServiceImpl implements SessionService {

    private final MentorshipSessionRepository repository;
    private final ModelMapper modelMapper;
    private final RabbitTemplate rabbitTemplate;
    private final MentorClient mentorClient;

    @Value("${skillsync.admin.user-id:1}")
    private Long adminUserId = 1L;

    public SessionServiceImpl(MentorshipSessionRepository repository, ModelMapper modelMapper, RabbitTemplate rabbitTemplate, MentorClient mentorClient) {
        this.repository = repository;
        this.modelMapper = modelMapper;
        this.rabbitTemplate = rabbitTemplate;
        this.mentorClient = mentorClient;
    }

    @Override
    public SessionResponse requestSession(SessionRequest request) {
        MentorshipSession session = MentorshipSession.builder()
                .mentorId(request.getMentorId())
                .learnerId(request.getLearnerId())
                .sessionDateTime(request.getSessionDateTime())
                .durationMinutes(request.getDurationMinutes())
                .topic(request.getTopic())
                .status(SessionStatus.REQUESTED)
                .build();
        MentorshipSession saved = repository.save(session);
        Long mentorUserId = getMentorUserId(saved.getMentorId());
        publishToUser(saved.getLearnerId(), saved, "SESSION_BOOKED", "session.booked",
                "Session request sent for " + topic(saved) + ".");
        publishToUser(mentorUserId, saved, "SESSION_REQUESTED", "session.booked",
                "New learner booking request for " + topic(saved) + ".");
        publishToUser(adminUserId, saved, "SESSION_BOOKED", "session.booked",
                "A learner booked " + topic(saved) + " with mentor profile " + saved.getMentorId() + ".");
        return toResponse(saved);
    }

    @Override
    public SessionResponse accept(Long id) {
        MentorshipSession session = getById(id);
        ensureState(session, SessionStatus.REQUESTED, "Only requested sessions can be accepted");
        session.setStatus(SessionStatus.ACCEPTED);
        MentorshipSession saved = repository.save(session);
        Long mentorUserId = getMentorUserId(saved.getMentorId());
        publishToUser(saved.getLearnerId(), saved, "SESSION_ACCEPTED", "session.accepted",
                "Your session " + topic(saved) + " was accepted by the mentor.");
        publishToUser(mentorUserId, saved, "SESSION_ACCEPTED", "session.accepted",
                "You accepted the learner request for " + topic(saved) + ".");
        publishToUser(adminUserId, saved, "SESSION_ACCEPTED", "session.accepted",
                "Session " + topic(saved) + " was accepted by mentor profile " + saved.getMentorId() + ".");
        return toResponse(saved);
    }

    @Override
    public SessionResponse reject(Long id) {
        MentorshipSession session = getById(id);
        ensureState(session, SessionStatus.REQUESTED, "Only requested sessions can be rejected");
        session.setStatus(SessionStatus.REJECTED);
        MentorshipSession saved = repository.save(session);
        Long mentorUserId = getMentorUserId(saved.getMentorId());
        publishToUser(saved.getLearnerId(), saved, "SESSION_REJECTED", "session.rejected",
                "Your session " + topic(saved) + " was declined by the mentor.");
        publishToUser(mentorUserId, saved, "SESSION_REJECTED", "session.rejected",
                "You declined the learner request for " + topic(saved) + ".");
        publishToUser(adminUserId, saved, "SESSION_REJECTED", "session.rejected",
                "Session " + topic(saved) + " was declined by mentor profile " + saved.getMentorId() + ".");
        return toResponse(saved);
    }

    @Override
    public SessionResponse cancel(Long id) {
        MentorshipSession session = getById(id);
        if (session.getStatus() == SessionStatus.COMPLETED || session.getStatus() == SessionStatus.REJECTED) {
            throw new BusinessException("Completed or rejected sessions cannot be cancelled");
        }
        session.setStatus(SessionStatus.CANCELLED);
        MentorshipSession saved = repository.save(session);
        Long mentorUserId = getMentorUserId(saved.getMentorId());
        publishToUser(saved.getLearnerId(), saved, "SESSION_CANCELLED", "session.cancelled",
                "Session " + topic(saved) + " was cancelled.");
        publishToUser(mentorUserId, saved, "SESSION_CANCELLED", "session.cancelled",
                "Session " + topic(saved) + " was cancelled.");
        publishToUser(adminUserId, saved, "SESSION_CANCELLED", "session.cancelled",
                "Session " + topic(saved) + " was cancelled.");
        return toResponse(saved);
    }

    @Override
    public SessionResponse complete(Long id) {
        MentorshipSession session = getById(id);
        ensureState(session, SessionStatus.ACCEPTED, "Only accepted sessions can be completed");
        session.setStatus(SessionStatus.COMPLETED);
        MentorshipSession saved = repository.save(session);
        Long mentorUserId = getMentorUserId(saved.getMentorId());
        publishToUser(saved.getLearnerId(), saved, "SESSION_COMPLETED", "session.completed",
                "Session " + topic(saved) + " is completed. Please give a rating for this mentor.");
        publishToUser(mentorUserId, saved, "SESSION_COMPLETED", "session.completed",
                "You marked " + topic(saved) + " as completed.");
        publishToUser(adminUserId, saved, "SESSION_COMPLETED", "session.completed",
                "Session " + topic(saved) + " was completed and is ready for learner review.");
        return toResponse(saved);
    }

    @Override
    public SessionResponse updateMeetingLink(Long id, String meetingLink) {
        MentorshipSession session = getById(id);
        if (session.getStatus() != SessionStatus.ACCEPTED) {
            throw new BusinessException("Meeting link can be added only after accepting the session");
        }
        session.setMeetingLink(meetingLink == null ? null : meetingLink.trim());
        MentorshipSession saved = repository.save(session);
        Long mentorUserId = getMentorUserId(saved.getMentorId());
        publishToUser(saved.getLearnerId(), saved, "SESSION_MEETING_LINK_ADDED", "session.meeting-link.added",
                "Meeting link added for " + topic(saved) + ".");
        publishToUser(mentorUserId, saved, "SESSION_MEETING_LINK_ADDED", "session.meeting-link.added",
                "You added a meeting link for " + topic(saved) + ".");
        publishToUser(adminUserId, saved, "SESSION_MEETING_LINK_ADDED", "session.meeting-link.added",
                "Meeting link added for " + topic(saved) + ".");
        return toResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<SessionResponse> getAll(int page, int size, String sortBy, String sortDir) {
        Sort sort = sortDir.equalsIgnoreCase("desc") ? Sort.by(sortBy).descending() : Sort.by(sortBy).ascending();
        Page<MentorshipSession> result = repository.findAll(PageRequest.of(page, size, sort));
        return PageResponse.<SessionResponse>builder()
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
    public PageResponse<SessionResponse> getByUserId(Long userId, int page, int size, String sortBy, String sortDir) {
        Sort sort = sortDir.equalsIgnoreCase("desc") ? Sort.by(sortBy).descending() : Sort.by(sortBy).ascending();
        Page<MentorshipSession> result = repository.findByLearnerIdOrMentorId(userId, userId, PageRequest.of(page, size, sort));
        return PageResponse.<SessionResponse>builder()
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
    public PageResponse<SessionResponse> getByMentorId(Long mentorId, int page, int size, String sortBy, String sortDir) {
        Sort sort = sortDir.equalsIgnoreCase("desc") ? Sort.by(sortBy).descending() : Sort.by(sortBy).ascending();
        Page<MentorshipSession> result = repository.findByMentorId(mentorId, PageRequest.of(page, size, sort));
        return PageResponse.<SessionResponse>builder()
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
    public SessionSummaryResponse getSummaryByUserId(Long userId) {
        return SessionSummaryResponse.builder()
                .userId(userId)
                .totalSessions(repository.countByLearnerIdOrMentorId(userId, userId))
                .requestedSessions(repository.countByUserIdAndStatus(userId, SessionStatus.REQUESTED))
                .acceptedSessions(repository.countByUserIdAndStatus(userId, SessionStatus.ACCEPTED))
                .rejectedSessions(repository.countByUserIdAndStatus(userId, SessionStatus.REJECTED))
                .completedSessions(repository.countByUserIdAndStatus(userId, SessionStatus.COMPLETED))
                .cancelledSessions(repository.countByUserIdAndStatus(userId, SessionStatus.CANCELLED))
                .build();
    }

    private void ensureState(MentorshipSession session, SessionStatus expected, String message) {
        if (session.getStatus() != expected) {
            throw new BusinessException(message);
        }
    }

    private MentorshipSession getById(Long id) {
        return repository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Session not found with the id " + id));
    }

    private SessionResponse toResponse(MentorshipSession session) {
        SessionResponse response = modelMapper.map(session, SessionResponse.class);
        response.setStatus(session.getStatus().name());
        return response;
    }

    private Long getMentorUserId(Long mentorId) {
        try {
            MentorResponse mentor = mentorClient.getById(mentorId);
            return mentor == null ? null : mentor.getUserId();
        } catch (Exception ignored) {
            return null;
        }
    }

    private String topic(MentorshipSession session) {
        String value = String.valueOf(session.getTopic() == null ? "" : session.getTopic()).trim();
        return value.isBlank() ? "mentoring session" : "\"" + value + "\"";
    }

    private void publishToUser(Long userId, MentorshipSession session, String eventType, String routingKey, String message) {
        if (userId == null) {
            return;
        }
        try {
            rabbitTemplate.convertAndSend(RabbitConfig.EXCHANGE, routingKey,
                    NotificationEvent.builder()
                            .eventType(eventType)
                            .userId(userId)
                            .message(message)
                            .eventTime(LocalDateTime.now())
                            .sessionId(session.getId())
                            .mentorId(session.getMentorId())
                            .learnerId(session.getLearnerId())
                            .build());
        } catch (Exception ignored) {
        }
    }
}
