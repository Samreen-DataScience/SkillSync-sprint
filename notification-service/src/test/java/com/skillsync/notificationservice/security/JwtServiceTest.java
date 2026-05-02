package com.skillsync.notificationservice.security;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.nio.charset.StandardCharsets;

import static org.junit.jupiter.api.Assertions.assertEquals;

class JwtServiceTest {

    private JwtService jwtService;

    @BeforeEach
    void setUp() {
        jwtService = new JwtService();
        ReflectionTestUtils.setField(jwtService, "secret", "12345678901234567890123456789012");
    }

    @Test
    void parseClaimsReturnsSubject() {
        String secret = "12345678901234567890123456789012";
        String token = Jwts.builder()
                .subject("notify@skillsync.com")
                .signWith(Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8)))
                .compact();

        var claims = jwtService.parseClaims(token);

        assertEquals("notify@skillsync.com", claims.getSubject());
    }
}
