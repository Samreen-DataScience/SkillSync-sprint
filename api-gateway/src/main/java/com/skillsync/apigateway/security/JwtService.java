package com.skillsync.apigateway.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;

@Component
public class JwtService {

    @Value("${security.jwt.secret:skillsyncskillsyncskillsyncskillsyncskillsync12345}")
    private String secret;

    public Claims parseClaims(String token) {
        if (secret == null || secret.isBlank()) {
            throw new IllegalStateException("JWT secret is not configured in api-gateway");
        }

        SecretKey key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        return Jwts.parser().verifyWith(key).build().parseSignedClaims(token).getPayload();
    }
}
