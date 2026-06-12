package com.roomrental.api.common.util;

import com.roomrental.api.common.exception.AppException;
import java.time.Duration;
import java.util.concurrent.TimeUnit;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class RedisRateLimitService {

    private final RedisTemplate<String, String> redisTemplate;

    public long hit(String key, Duration window) {
        Long count = redisTemplate.opsForValue().increment(key);
        if (count != null && count == 1) {
            redisTemplate.expire(key, window.toMillis(), TimeUnit.MILLISECONDS);
        }
        return count != null ? count : 0;
    }

    public void checkLimit(String key, int limit, Duration window, String message) {
        long count = hit(key, window);
        if (count > limit) {
            throw AppException.tooManyRequests(message);
        }
    }

    public boolean isLimited(String key, int limit) {
        String value = redisTemplate.opsForValue().get(key);
        if (value == null) {
            return false;
        }
        try {
            return Long.parseLong(value) >= limit;
        } catch (NumberFormatException ex) {
            redisTemplate.delete(key);
            return false;
        }
    }

    public void reset(String key) {
        redisTemplate.delete(key);
    }
}
