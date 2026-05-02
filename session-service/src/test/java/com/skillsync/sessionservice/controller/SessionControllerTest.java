package com.skillsync.sessionservice.controller;

import com.skillsync.sessionservice.dto.PageResponse;
import com.skillsync.sessionservice.dto.MeetingLinkRequest;
import com.skillsync.sessionservice.dto.SessionRequest;
import com.skillsync.sessionservice.dto.SessionResponse;
import com.skillsync.sessionservice.dto.SessionSummaryResponse;
import com.skillsync.sessionservice.service.SessionService;
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
class SessionControllerTest {

    @Mock
    private SessionService sessionService;

    private SessionController controller;

    @BeforeEach
    void setUp() {
        controller = new SessionController(sessionService);
    }

    @Test
    void createReturnsCreated() {
        SessionRequest req = new SessionRequest();
        SessionResponse res = new SessionResponse();
        when(sessionService.requestSession(req)).thenReturn(res);

        var response = controller.create(req);

        assertEquals(HttpStatus.CREATED, response.getStatusCode());
        assertEquals(res, response.getBody());
    }

    @Test
    void completeReturnsOk() {
        SessionResponse res = new SessionResponse();
        when(sessionService.complete(2L)).thenReturn(res);

        var response = controller.complete(2L);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(res, response.getBody());
    }

    @Test
    void updateMeetingLinkReturnsOk() {
        MeetingLinkRequest request = new MeetingLinkRequest();
        request.setMeetingLink("https://meet.google.com/abc-defg-hij");
        SessionResponse res = new SessionResponse();
        res.setMeetingLink(request.getMeetingLink());
        when(sessionService.updateMeetingLink(2L, request.getMeetingLink())).thenReturn(res);

        var response = controller.updateMeetingLink(2L, request);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(res, response.getBody());
    }

    @Test
    void getByUserReturnsPage() {
        PageResponse<SessionResponse> page = PageResponse.<SessionResponse>builder().content(List.of()).build();
        when(sessionService.getByUserId(1L, 0, 10, "id", "asc")).thenReturn(page);

        var response = controller.getByUser(1L, 0, 10, "id", "asc");

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(page, response.getBody());
    }

    @Test
    void getAllReturnsPage() {
        PageResponse<SessionResponse> page = PageResponse.<SessionResponse>builder().content(List.of()).build();
        when(sessionService.getAll(0, 50, "id", "desc")).thenReturn(page);

        var response = controller.getAll(0, 50, "id", "desc");

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(page, response.getBody());
    }

    @Test
    void getSummaryReturnsSummary() {
        SessionSummaryResponse summary = new SessionSummaryResponse();
        when(sessionService.getSummaryByUserId(1L)).thenReturn(summary);

        var response = controller.getSummary(1L);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(summary, response.getBody());
    }
}
