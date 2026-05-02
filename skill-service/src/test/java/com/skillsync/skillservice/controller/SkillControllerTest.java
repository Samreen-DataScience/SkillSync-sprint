package com.skillsync.skillservice.controller;

import com.skillsync.skillservice.dto.PageResponse;
import com.skillsync.skillservice.dto.SkillRequest;
import com.skillsync.skillservice.dto.SkillResponse;
import com.skillsync.skillservice.service.SkillService;
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
class SkillControllerTest {

    @Mock
    private SkillService skillService;

    private SkillController controller;

    @BeforeEach
    void setUp() {
        controller = new SkillController(skillService);
    }

    @Test
    void createReturnsCreated() {
        SkillRequest request = new SkillRequest();
        SkillResponse responseBody = new SkillResponse();
        when(skillService.create(request)).thenReturn(responseBody);

        var response = controller.create(request);

        assertEquals(HttpStatus.CREATED, response.getStatusCode());
        assertEquals(responseBody, response.getBody());
    }

    @Test
    void getByIdReturnsOk() {
        SkillResponse responseBody = new SkillResponse();
        when(skillService.getById(1L)).thenReturn(responseBody);

        var response = controller.getById(1L);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(responseBody, response.getBody());
    }

    @Test
    void getAllReturnsPage() {
        PageResponse<SkillResponse> page = PageResponse.<SkillResponse>builder().content(List.of()).build();
        when(skillService.getAll(0, 10, "id", "asc")).thenReturn(page);

        var response = controller.getAll(0, 10, "id", "asc");

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(page, response.getBody());
    }
}
