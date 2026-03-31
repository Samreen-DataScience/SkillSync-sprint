package com.skillsync.sessionservice.service.serviceImpl;

import com.skillsync.sessionservice.config.RabbitConfig;
import com.skillsync.sessionservice.dto.PageResponse;
import com.skillsync.sessionservice.dto.SessionRequest;
import com.skillsync.sessionservice.dto.SessionResponse;
import com.skillsync.sessionservice.dto.SessionSummaryResponse;
import com.skillsync.sessionservice.entity.MentorshipSession;
import com.skillsync.sessionservice.entity.SessionStatus;
import com.skillsync.sessionservice.repository.MentorshipSessionRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.modelmapper.ModelMapper;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SessionServiceImplTest {

    @Mock
    private MentorshipSessionRepository repository;

    @Mock
    private ModelMapper modelMapper;

    @Mock
    private RabbitTemplate rabbitTemplate;

    @InjectMocks
    private SessionServiceImpl sessionService;

    @Test
    void requestSessionShouldCreateRequestedSessionAndPublishEvent() {
        SessionRequest request = new SessionRequest();
        request.setMentorId(1L);
        request.setLearnerId(2L);
        request.setSessionDateTime(LocalDateTime.now().plusDays(1));
        request.setDurationMinutes(60);
        request.setTopic("Spring Boot");

        MentorshipSession saved = MentorshipSession.builder()
                .id(1L)
                .mentorId(1L)
                .learnerId(2L)
                .sessionDateTime(request.getSessionDateTime())
                .durationMinutes(60)
                .topic("Spring Boot")
                .status(SessionStatus.REQUESTED)
                .build();
        SessionResponse mapped = new SessionResponse();
        mapped.setId(1L);

        when(repository.save(any(MentorshipSession.class))).thenReturn(saved);
        when(modelMapper.map(saved, SessionResponse.class)).thenReturn(mapped);

        SessionResponse response = sessionService.requestSession(request);

        assertEquals(1L, response.getId());
        assertEquals("REQUESTED", response.getStatus());
        verify(rabbitTemplate).convertAndSend(eq(RabbitConfig.EXCHANGE), eq("session.booked"), any(Object.class));
    }

    @Test
    void acceptShouldMarkRequestedSessionAsAccepted() {
        MentorshipSession session = baseSession(2L, SessionStatus.REQUESTED);
        SessionResponse mapped = new SessionResponse();
        mapped.setId(2L);

        when(repository.findById(2L)).thenReturn(Optional.of(session));
        when(repository.save(session)).thenReturn(session);
        when(modelMapper.map(session, SessionResponse.class)).thenReturn(mapped);

        SessionResponse response = sessionService.accept(2L);

        assertEquals("ACCEPTED", response.getStatus());
        verify(rabbitTemplate).convertAndSend(eq(RabbitConfig.EXCHANGE), eq("session.accepted"), any(Object.class));
    }

    @Test
    void rejectShouldMarkRequestedSessionAsRejected() {
        MentorshipSession session = baseSession(3L, SessionStatus.REQUESTED);
        SessionResponse mapped = new SessionResponse();
        mapped.setId(3L);

        when(repository.findById(3L)).thenReturn(Optional.of(session));
        when(repository.save(session)).thenReturn(session);
        when(modelMapper.map(session, SessionResponse.class)).thenReturn(mapped);

        SessionResponse response = sessionService.reject(3L);

        assertEquals("REJECTED", response.getStatus());
        verify(rabbitTemplate).convertAndSend(eq(RabbitConfig.EXCHANGE), eq("session.rejected"), any(Object.class));
    }

    @Test
    void cancelShouldMarkSessionAsCancelled() {
        MentorshipSession session = baseSession(4L, SessionStatus.ACCEPTED);
        SessionResponse mapped = new SessionResponse();
        mapped.setId(4L);

        when(repository.findById(4L)).thenReturn(Optional.of(session));
        when(repository.save(session)).thenReturn(session);
        when(modelMapper.map(session, SessionResponse.class)).thenReturn(mapped);

        SessionResponse response = sessionService.cancel(4L);

        assertEquals("CANCELLED", response.getStatus());
        verify(rabbitTemplate).convertAndSend(eq(RabbitConfig.EXCHANGE), eq("session.cancelled"), any(Object.class));
    }

    @Test
    void completeShouldMarkAcceptedSessionAsCompleted() {
        MentorshipSession session = baseSession(5L, SessionStatus.ACCEPTED);
        SessionResponse mapped = new SessionResponse();
        mapped.setId(5L);

        when(repository.findById(5L)).thenReturn(Optional.of(session));
        when(repository.save(session)).thenReturn(session);
        when(modelMapper.map(session, SessionResponse.class)).thenReturn(mapped);

        SessionResponse response = sessionService.complete(5L);

        assertEquals("COMPLETED", response.getStatus());
        verify(rabbitTemplate).convertAndSend(eq(RabbitConfig.EXCHANGE), eq("session.completed"), any(Object.class));
    }

    @Test
    void getByUserIdShouldReturnPagedSessions() {
        MentorshipSession session = baseSession(6L, SessionStatus.REQUESTED);
        SessionResponse mapped = new SessionResponse();
        mapped.setId(6L);

        when(repository.findByLearnerIdOrMentorId(eq(2L), eq(2L), any()))
                .thenReturn(new PageImpl<>(List.of(session), PageRequest.of(0, 10), 1));
        when(modelMapper.map(session, SessionResponse.class)).thenReturn(mapped);

        PageResponse<SessionResponse> response = sessionService.getByUserId(2L, 0, 10, "id", "asc");

        assertEquals(1, response.getContent().size());
        assertEquals("REQUESTED", response.getContent().get(0).getStatus());
    }

    @Test
    void getSummaryByUserIdShouldReturnStatusWiseCounts() {
        when(repository.countByLearnerIdOrMentorId(3L, 3L)).thenReturn(4L);
        when(repository.countByUserIdAndStatus(3L, SessionStatus.REQUESTED)).thenReturn(1L);
        when(repository.countByUserIdAndStatus(3L, SessionStatus.ACCEPTED)).thenReturn(1L);
        when(repository.countByUserIdAndStatus(3L, SessionStatus.REJECTED)).thenReturn(0L);
        when(repository.countByUserIdAndStatus(3L, SessionStatus.COMPLETED)).thenReturn(1L);
        when(repository.countByUserIdAndStatus(3L, SessionStatus.CANCELLED)).thenReturn(1L);

        SessionSummaryResponse response = sessionService.getSummaryByUserId(3L);

        assertEquals(3L, response.getUserId());
        assertEquals(4L, response.getTotalSessions());
        assertEquals(1L, response.getRequestedSessions());
        assertEquals(1L, response.getAcceptedSessions());
        assertEquals(0L, response.getRejectedSessions());
        assertEquals(1L, response.getCompletedSessions());
        assertEquals(1L, response.getCancelledSessions());
    }

    private MentorshipSession baseSession(Long id, SessionStatus status) {
        return MentorshipSession.builder()
                .id(id)
                .mentorId(1L)
                .learnerId(2L)
                .sessionDateTime(LocalDateTime.now().plusDays(1))
                .durationMinutes(60)
                .topic("System Design")
                .status(status)
                .build();
    }
}
