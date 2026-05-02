package com.skillsync.mentorservice.exception;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MissingServletRequestParameterException;

import static org.junit.jupiter.api.Assertions.assertEquals;

class GlobalExceptionHandlerTest {

    private GlobalExceptionHandler handler;
    private MockHttpServletRequest request;

    @BeforeEach
    void setUp() {
        handler = new GlobalExceptionHandler();
        request = new MockHttpServletRequest();
        request.setRequestURI("/mentors/test");
    }

    @Test
    void handlesCommonAndGenericExceptions() {
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

    @Test
    void handlesBadRequestSpecificExceptions() throws Exception {
        var missingParam = handler.handleBadRequest(new MissingServletRequestParameterException("userId", "Long"), request);
        var unreadable = handler.handleBadRequest(new HttpMessageNotReadableException("bad payload"), request);
        var methodNotAllowed = handler.handleMethodNotAllowed(new HttpRequestMethodNotSupportedException("POST"), request);

        assertEquals(HttpStatus.BAD_REQUEST, missingParam.getStatusCode());
        assertEquals(HttpStatus.BAD_REQUEST, unreadable.getStatusCode());
        assertEquals(HttpStatus.METHOD_NOT_ALLOWED, methodNotAllowed.getStatusCode());
    }
}
