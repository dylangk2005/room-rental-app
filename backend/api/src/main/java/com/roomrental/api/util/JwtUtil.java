package com.roomrental.api.util;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.util.Date;

@Component
public class JwtUtil {

    @Value("${jwt.secret}")
    private String secret;

    @Value("900") // 15 phút
    private long expiration;

    // Tạo SecretKey từ chuỗi secret
    private SecretKey getSigningKey() {
        return Keys.hmacShaKeyFor(secret.getBytes());
    }

    // Tạo JWT token từ email + role
    public String generateToken(String email, String role) {
        return Jwts.builder()
                .subject(email)
                .claim("role", role)
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + expiration))
                .signWith(getSigningKey())
                .compact();
    }

    public String generateRefreshToken(String email) {
        return Jwts.builder()
                .subject(email)
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + expiration * 96)) // 24 giờ
                .signWith(getSigningKey())
                .compact();
    }

    // Lấy email từ token
    public String extractEmail(String token) {
        return parseClaims(token).getSubject();
    }

    // Lấy role từ token
    public String extractRole(String token) {
        return parseClaims(token).get("role", String.class);
    }

    // Kiểm tra token còn hợp lệ không
    public boolean isTokenValid(String token) {
        try {
            parseClaims(token);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }

    private Claims parseClaims(String token) {
        return Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}