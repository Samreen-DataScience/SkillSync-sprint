package com.skillsync.authservice.controller;

import com.skillsync.authservice.dto.AuthResponse;
import com.skillsync.authservice.dto.LoginRequest;
import com.skillsync.authservice.dto.RefreshTokenRequest;
import com.skillsync.authservice.dto.RegisterRequest;
import com.skillsync.authservice.service.AuthService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthControllerTest {

    @Mock
    private AuthService authService;

    private AuthController controller;

    @BeforeEach
    void setUp() {
        controller = new AuthController(authService);
    }

    @Test
    void registerReturnsCreated() {
        RegisterRequest req = new RegisterRequest();
        AuthResponse res = AuthResponse.builder().build();
        when(authService.register(req)).thenReturn(res);

        var response = controller.register(req);

        assertEquals(HttpStatus.CREATED, response.getStatusCode());
        assertEquals(res, response.getBody());
    }

    @Test
    void loginReturnsOk() {
        LoginRequest req = new LoginRequest();
        AuthResponse res = AuthResponse.builder().build();
        when(authService.login(req)).thenReturn(res);

        var response = controller.login(req);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(res, response.getBody());
    }

    @Test
    void refreshReturnsOk() {
        RefreshTokenRequest req = new RefreshTokenRequest();
        AuthResponse res = AuthResponse.builder().build();
        when(authService.refresh(req)).thenReturn(res);

        var response = controller.refresh(req);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(res, response.getBody());
    }
}
