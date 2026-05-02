package com.skillsync.authservice.security;

import io.jsonwebtoken.Claims;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class JwtServiceTest {

    private JwtService jwtService;
    private UserDetails userDetails;

    @BeforeEach
    void setUp() {
        jwtService = new JwtService();
        ReflectionTestUtils.setField(jwtService, "secret", "12345678901234567890123456789012");
        ReflectionTestUtils.setField(jwtService, "expirationMs", 60000L);
        userDetails = User.withUsername("admin@skillsync.com").password("x").authorities("ROLE_ADMIN").build();
    }

    @Test
    void generateAndParseClaimsWorks() {
        String token = jwtService.generateToken(userDetails, 1L, List.of("ROLE_ADMIN"));
        Claims claims = jwtService.parseClaims(token);

        assertEquals("admin@skillsync.com", claims.getSubject());
        assertEquals(1, claims.get("uid", Integer.class));
    }

    @Test
    void isValidReturnsTrueForMatchingUser() {
        String token = jwtService.generateToken(userDetails, 1L, List.of("ROLE_ADMIN"));

        assertTrue(jwtService.isValid(token, userDetails));
    }

    @Test
    void isValidReturnsFalseForDifferentUser() {
        String token = jwtService.generateToken(userDetails, 1L, List.of("ROLE_ADMIN"));
        UserDetails different = User.withUsername("other@skillsync.com").password("x").authorities("ROLE_ADMIN").build();

        assertFalse(jwtService.isValid(token, different));
    }
}
