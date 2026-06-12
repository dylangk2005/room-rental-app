package com.roomrental.api.config;

import com.roomrental.api.moderation.entity.Report;
import com.roomrental.api.payment.entity.Deposit;
import com.roomrental.api.post.entity.Post;
import com.roomrental.api.user.entity.User;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    @Value("${frontend.url:http://localhost:5173}")
    private String frontendUrl;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                // 1. Tắt CSRF (dùng Cookie SameSite thay thế)
                .csrf(csrf -> csrf.disable())

                // 2. CORS
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))

                // 3. Stateless — không dùng session
                .sessionManagement(session ->
                        session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))

                // 4. Phân quyền endpoint
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(HttpMethod.POST, "/api/auth/change-password/otp").hasAnyRole("USER", "MODERATOR", "MANAGER", "ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/api/auth/change-password").hasAnyRole("USER", "MODERATOR", "MANAGER", "ADMIN")

                        // Public
                        .requestMatchers("/api/auth/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/posts/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/post-types/**").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/wallet/deposit/callback").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/wallet/deposit/callback").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/membership/levels").permitAll()

                        // Reports - User được gửi report và xem lịch sử của mình
                        .requestMatchers(HttpMethod.POST, "/api/reports").hasAnyRole("USER", "MODERATOR", "MANAGER", "ADMIN")
                        .requestMatchers(HttpMethod.GET, "/api/reports/my-history").hasAnyRole("USER", "MODERATOR", "MANAGER", "ADMIN")

                        // Reports - moderator xử lý nghiệp vụ báo cáo
                        .requestMatchers(HttpMethod.GET, "/api/reports").hasRole("MODERATOR")

                        .requestMatchers(HttpMethod.GET, "/api/reports/*").hasRole("MODERATOR")

                        .requestMatchers(HttpMethod.PUT, "/api/reports/*/resolve").hasRole("MODERATOR")

                        // User
                        .requestMatchers("/api/favorites/**").hasAnyRole("USER", "MODERATOR", "MANAGER", "ADMIN")
                        .requestMatchers("/api/notifications/**").hasAnyRole("USER", "MODERATOR", "MANAGER", "ADMIN")
                        .requestMatchers("/api/payments/**").hasAnyRole("USER", "MODERATOR", "MANAGER", "ADMIN")
                        .requestMatchers("/api/deposits/**").hasAnyRole("USER", "MODERATOR", "MANAGER", "ADMIN")
                        .requestMatchers(HttpMethod.POST, "/api/posts/**").hasAnyRole("USER", "MODERATOR", "MANAGER", "ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/api/posts/**").hasAnyRole("USER", "MODERATOR", "MANAGER", "ADMIN")
                        .requestMatchers("/api/wallet/**").hasAnyRole("USER", "MODERATOR", "MANAGER", "ADMIN")
                        .requestMatchers(HttpMethod.GET, "/api/membership/my-level").hasAnyRole("USER", "MODERATOR", "MANAGER", "ADMIN")
                        .requestMatchers("/api/users/profile").hasAnyRole("USER", "MODERATOR", "MANAGER", "ADMIN")

                        // Moderator
                        .requestMatchers("/api/moderator/**").hasAnyRole("MODERATOR", "MANAGER", "ADMIN")

                        // Moderation logs
                        .requestMatchers("/api/moderation-logs/my-history/**").hasRole("MODERATOR")
                        .requestMatchers("/api/moderation-logs/my-history").hasRole("MODERATOR")

                        .requestMatchers("/api/moderation-logs/**").hasRole("MANAGER")

                        .requestMatchers("/api/moderation/**").hasRole("MODERATOR")

                        // Manager
                        .requestMatchers("/api/manager/**").hasRole("MANAGER")

                        // Admin only
                        .requestMatchers("/api/admin/**").hasRole("ADMIN")

                        // Còn lại phải đăng nhập
                        .anyRequest().authenticated()
                )

                // 5. Thêm JWT filter
                .addFilterBefore(jwtAuthenticationFilter,
                        UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(List.of(frontendUrl));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true); // Bắt buộc để Cookie hoạt động
        config.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
