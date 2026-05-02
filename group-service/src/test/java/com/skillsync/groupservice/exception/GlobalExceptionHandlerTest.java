package com.skillsync.groupservice.exception;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.security.access.AccessDeniedException;

import static org.junit.jupiter.api.Assertions.assertEquals;

class GlobalExceptionHandlerTest {

    private GlobalExceptionHandler handler;
    private MockHttpServletRequest request;

    @BeforeEach
    void setUp() {
        handler = new GlobalExceptionHandler();
        request = new MockHttpServletRequest();
        request.setRequestURI("/groups/test");
    }

    @Test
    void handlesMainExceptionPaths() {
        var notFound = handler.handleNotFound(new ResourceNotFoundException("not found"), request);
        var duplicate = handler.handleDuplicate(new DuplicateResourceException("dup"), request);
        var business = handler.handleBusiness(new BusinessException("bad"), request);
        var denied = handler.handleDenied(new AccessDeniedException("no"), request);
        var generic = handler.handleGeneric(new RuntimeException("err"), request);

        assertEquals(HttpStatus.NOT_FOUND, notFound.getStatusCode());
        assertEquals(HttpStatus.CONFLICT, duplicate.getStatusCode());
        assertEquals(HttpStatus.BAD_REQUEST, business.getStatusCode());
        assertEquals(HttpStatus.FORBIDDEN, denied.getStatusCode());
        assertEquals(HttpStatus.INTERNAL_SERVER_ERROR, generic.getStatusCode());
    }
}
