package com.skillsync.userservice.controller;

import com.skillsync.userservice.dto.PageResponse;
import com.skillsync.userservice.dto.UserProfileRequest;
import com.skillsync.userservice.dto.UserProfileResponse;
import com.skillsync.userservice.service.UserProfileService;
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
class UserProfileControllerTest {

    @Mock
    private UserProfileService userProfileService;

    private UserProfileController controller;

    @BeforeEach
    void setUp() {
        controller = new UserProfileController(userProfileService);
    }

    @Test
    void createReturnsCreated() {
        UserProfileRequest req = new UserProfileRequest();
        UserProfileResponse res = new UserProfileResponse();
        when(userProfileService.create(req)).thenReturn(res);

        var response = controller.create(req);

        assertEquals(HttpStatus.CREATED, response.getStatusCode());
        assertEquals(res, response.getBody());
    }

    @Test
    void updateAndGetByIdReturnOk() {
        UserProfileRequest req = new UserProfileRequest();
        UserProfileResponse res = new UserProfileResponse();
        when(userProfileService.update(1L, req)).thenReturn(res);
        when(userProfileService.getById(1L)).thenReturn(res);

        var updateResponse = controller.update(1L, req);
        var getResponse = controller.getById(1L);

        assertEquals(HttpStatus.OK, updateResponse.getStatusCode());
        assertEquals(res, updateResponse.getBody());
        assertEquals(HttpStatus.OK, getResponse.getStatusCode());
        assertEquals(res, getResponse.getBody());
    }

    @Test
    void getAllReturnsPage() {
        PageResponse<UserProfileResponse> page = PageResponse.<UserProfileResponse>builder().content(List.of()).build();
        when(userProfileService.getAll(0, 10, "id", "asc")).thenReturn(page);

        var response = controller.getAll(0, 10, "id", "asc");

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(page, response.getBody());
    }
}
