package com.skillsync.sessionservice.service.serviceImpl;

import com.skillsync.sessionservice.config.RabbitConfig;
import com.skillsync.sessionservice.dto.PageResponse;
import com.skillsync.sessionservice.dto.SessionRequest;
import com.skillsync.sessionservice.dto.SessionResponse;
import com.skillsync.sessionservice.dto.SessionSummaryResponse;
import com.skillsync.sessionservice.entity.MentorshipSession;
import com.skillsync.sessionservice.entity.SessionStatus;
import com.skillsync.sessionservice.exception.BusinessException;
import com.skillsync.sessionservice.exception.ResourceNotFoundException;
import com.skillsync.sessionservice.messaging.NotificationEvent;
import com.skillsync.sessionservice.repository.MentorshipSessionRepository;
import com.skillsync.sessionservice.service.SessionService;
import org.modelmapper.ModelMapper;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
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

    public SessionServiceImpl(MentorshipSessionRepository repository, ModelMapper modelMapper, RabbitTemplate rabbitTemplate) {
        this.repository = repository;
        this.modelMapper = modelMapper;
        this.rabbitTemplate = rabbitTemplate;
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
        publish(saved, "SESSION_BOOKED", "session.booked", "New session request created");
        return toResponse(saved);
    }

    @Override
    public SessionResponse accept(Long id) {
        MentorshipSession session = getById(id);
        ensureState(session, SessionStatus.REQUESTED, "Only requested sessions can be accepted");
        session.setStatus(SessionStatus.ACCEPTED);
        MentorshipSession saved = repository.save(session);
        publish(saved, "SESSION_ACCEPTED", "session.accepted", "Session has been accepted");
        return toResponse(saved);
    }

    @Override
    public SessionResponse reject(Long id) {
        MentorshipSession session = getById(id);
        ensureState(session, SessionStatus.REQUESTED, "Only requested sessions can be rejected");
        session.setStatus(SessionStatus.REJECTED);
        MentorshipSession saved = repository.save(session);
        publish(saved, "SESSION_REJECTED", "session.rejected", "Session has been rejected");
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
        publish(saved, "SESSION_CANCELLED", "session.cancelled", "Session has been cancelled");
        return toResponse(saved);
    }

    @Override
    public SessionResponse complete(Long id) {
        MentorshipSession session = getById(id);
        ensureState(session, SessionStatus.ACCEPTED, "Only accepted sessions can be completed");
        session.setStatus(SessionStatus.COMPLETED);
        MentorshipSession saved = repository.save(session);
        publish(saved, "SESSION_COMPLETED", "session.completed", "Session has been completed");
        return toResponse(saved);
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

    private void publish(MentorshipSession session, String eventType, String routingKey, String message) {
        try {
            rabbitTemplate.convertAndSend(RabbitConfig.EXCHANGE, routingKey,
                    NotificationEvent.builder()
                            .eventType(eventType)
                            .userId(session.getLearnerId())
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
