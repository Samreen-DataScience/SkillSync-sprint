package com.skillsync.authservice.exception;

import jakarta.servlet.http.HttpServletRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;

import static org.junit.jupiter.api.Assertions.assertEquals;

class GlobalExceptionHandlerTest {

    private GlobalExceptionHandler handler;
    private HttpServletRequest request;

    @BeforeEach
    void setUp() {
        handler = new GlobalExceptionHandler();
        MockHttpServletRequest req = new MockHttpServletRequest();
        req.setRequestURI("/auth/test");
        request = req;
    }

    @Test
    void handleNotFoundReturns404() {
        var response = handler.handleNotFound(new ResourceNotFoundException("missing"), request);
        assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
        assertEquals("missing", response.getBody().getMessage());
    }

    @Test
    void handleDuplicateReturns409() {
        var response = handler.handleDuplicate(new DuplicateResourceException("exists"), request);
        assertEquals(HttpStatus.CONFLICT, response.getStatusCode());
        assertEquals("exists", response.getBody().getMessage());
    }

    @Test
    void handleBusinessAndBadCredentialsReturnExpectedStatus() {
        var business = handler.handleBusiness(new BusinessException("invalid"), request);
        var badCreds = handler.handleBusiness(new BadCredentialsException("x"), request);

        assertEquals(HttpStatus.BAD_REQUEST, business.getStatusCode());
        assertEquals("invalid", business.getBody().getMessage());
        assertEquals(HttpStatus.UNAUTHORIZED, badCreds.getStatusCode());
        assertEquals("Invalid credentials", badCreds.getBody().getMessage());
    }

    @Test
    void handleDeniedAndGenericReturnExpectedStatus() {
        var denied = handler.handleDenied(new AccessDeniedException("no"), request);
        var generic = handler.handleGeneric(new RuntimeException("oops"), request);

        assertEquals(HttpStatus.FORBIDDEN, denied.getStatusCode());
        assertEquals("Access denied", denied.getBody().getMessage());
        assertEquals(HttpStatus.INTERNAL_SERVER_ERROR, generic.getStatusCode());
        assertEquals("Internal server error", generic.getBody().getMessage());
    }
}
