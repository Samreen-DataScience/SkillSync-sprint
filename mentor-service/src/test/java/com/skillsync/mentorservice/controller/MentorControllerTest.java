package com.skillsync.mentorservice.controller;

import com.skillsync.mentorservice.dto.MentorApplyRequest;
import com.skillsync.mentorservice.dto.MentorAvailabilityRequest;
import com.skillsync.mentorservice.dto.MentorResponse;
import com.skillsync.mentorservice.dto.MentorSummaryResponse;
import com.skillsync.mentorservice.dto.PageResponse;
import com.skillsync.mentorservice.service.MentorService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class MentorControllerTest {

    @Mock
    private MentorService mentorService;

    private MentorController controller;

    @BeforeEach
    void setUp() {
        controller = new MentorController(mentorService);
    }

    @Test
    void applyReturnsCreated() {
        MentorApplyRequest req = new MentorApplyRequest();
        MentorResponse res = new MentorResponse();
        when(mentorService.apply(req)).thenReturn(res);

        var response = controller.apply(req);

        assertEquals(HttpStatus.CREATED, response.getStatusCode());
        assertEquals(res, response.getBody());
    }

    @Test
    void getAllReturnsOk() {
        PageResponse<MentorResponse> page = PageResponse.<MentorResponse>builder().content(List.of()).build();
        when(mentorService.getAll("1", null, null, null, null, 0, 10, "id", "asc")).thenReturn(page);

        var response = controller.getAll("1", null, null, null, null, 0, 10, "id", "asc");

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(page, response.getBody());
    }

    @Test
    void getSummaryReturnsOk() {
        MentorSummaryResponse summary = new MentorSummaryResponse();
        when(mentorService.getSummary()).thenReturn(summary);

        var response = controller.getSummary();

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(summary, response.getBody());
    }

    @Test
    void updateAvailabilityCallsService() {
        MentorAvailabilityRequest req = new MentorAvailabilityRequest();
        MentorResponse res = new MentorResponse();
        when(mentorService.updateAvailability(1L, req)).thenReturn(res);

        var response = controller.updateAvailability(1L, req);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(res, response.getBody());
        verify(mentorService).updateAvailability(1L, req);
    }
}
