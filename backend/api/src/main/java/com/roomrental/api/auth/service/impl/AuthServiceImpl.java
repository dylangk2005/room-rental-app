package com.roomrental.api.auth.service.impl;

import com.roomrental.api.admin.entity.AuditLog;
import com.roomrental.api.admin.service.AuditLogService;
import com.roomrental.api.auth.dto.response.AuthResponse;
import com.roomrental.api.auth.dto.request.ChangePasswordRequest;
import com.roomrental.api.auth.dto.request.ForgotPasswordRequest;
import com.roomrental.api.auth.dto.request.LoginRequest;
import com.roomrental.api.auth.dto.request.RegisterRequest;
import com.roomrental.api.auth.dto.request.ResetPasswordRequest;
import com.roomrental.api.auth.dto.request.VerifyOtpRequest;
import com.roomrental.api.auth.service.AuthService;
import com.roomrental.api.common.exception.AppException;
import com.roomrental.api.common.util.JwtUtil;
import com.roomrental.api.common.util.RedisRateLimitService;
import com.roomrental.api.integration.service.EmailService;
import com.roomrental.api.pricing.entity.MembershipLevel;
import com.roomrental.api.pricing.repository.MembershipLevelRepository;
import com.roomrental.api.pricing.service.MembershipService;
import com.roomrental.api.user.dto.response.UserResponse;
import com.roomrental.api.user.entity.Role;
import com.roomrental.api.user.entity.User;
import com.roomrental.api.user.repository.RoleRepository;
import com.roomrental.api.user.repository.UserRepository;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.Duration;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.TimeUnit;
import java.util.Random;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private static final Duration OTP_TTL = Duration.ofMinutes(5);
    private static final Duration OTP_SEND_RATE_WINDOW = Duration.ofMinutes(10);
    private static final Duration OTP_ATTEMPT_WINDOW = Duration.ofMinutes(5);
    private static final Duration LOGIN_RATE_WINDOW = Duration.ofMinutes(10);
    private static final long REFRESH_TOKEN_TTL_DAYS = 1;
    private static final int OTP_SEND_EMAIL_LIMIT = 3;
    private static final int OTP_SEND_IP_LIMIT = 10;
    private static final int OTP_ATTEMPT_LIMIT = 5;
    private static final int LOGIN_EMAIL_LIMIT = 5;
    private static final int LOGIN_IP_LIMIT = 20;

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final MembershipLevelRepository membershipLevelRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final RedisTemplate<String, String> redisTemplate;
    private final RedisRateLimitService rateLimitService;
    private final EmailService emailService;
    private final AuditLogService auditLogService;
    private final MembershipService membershipService;
    private Boolean mustChangePassword;

    @Value("${app.cookie.secure:false}")
    private boolean secureCookies;

    @Override
    public void register(RegisterRequest request) {
        String email = normalizeEmail(request.getEmail());
        assertOtpSendAllowed("register", email);

        // kiểm tra email đã tồn tại chưa
        if (userRepository.existsByEmail(email)) {
            throw AppException.badRequest("Email đã tồn tại");
        }

        // kiểm tra số điện thoại đã tồn tại chưa
        if (userRepository.existsByPhoneNumber(request.getPhoneNumber())) {
            throw AppException.badRequest("Số điện thoại đã tồn tại");
        }
        // Tạo OTP 6 số
        String otp = String.format("%06d", new Random().nextInt(999999));

        // Lưu thông tin đăng ký tạm vào Redis (5 phút)
        String key = buildOtpKey("register", email);
        redisTemplate.opsForHash().put(key, "otp", otp);
        redisTemplate.opsForHash().put(key, "fullName", request.getFullName());
        redisTemplate.opsForHash().put(key, "password", passwordEncoder.encode(request.getPassword()));
        redisTemplate.opsForHash().put(key, "phoneNumber", request.getPhoneNumber());
        redisTemplate.expire(key, OTP_TTL.toMillis(), TimeUnit.MILLISECONDS);

        // TODO: Gửi OTP qua email
        emailService.sendOtp(email, otp);
    }

    @Override
    public void verifyOtp(VerifyOtpRequest request) {
        String email = normalizeEmail(request.getEmail());
        String key = buildOtpKey("register", email);

        // Kiểm tra OTP còn tồn tại không
        String storedOtp = (String) redisTemplate.opsForHash().get(key, "otp");
        if (storedOtp == null) {
            throw AppException.badRequest("OTP đã hết hạn hoặc không tồn tại");
        }

        // Kiểm tra OTP có đúng không
        if (!storedOtp.equals(request.getOtp())) {
            recordInvalidOtp("register", email);
            throw AppException.badRequest("OTP không đúng");
        }
        clearOtpAttempt("register", email);

        // Lấy thông tin đăng ký tạm thời từ Redis
        String fullName = (String) redisTemplate.opsForHash().get(key, "fullName");
        String password = (String) redisTemplate.opsForHash().get(key, "password");
        String phoneNumber = (String) redisTemplate.opsForHash().get(key, "phoneNumber");

        // Lấy quyền và cấp độ mặc định
        Role role = roleRepository.findByName("USER")
                .orElseThrow(() -> AppException.notFound("Role không tồn tại"));
        MembershipLevel membershipLevel = membershipLevelRepository.findFirstByOrderByMinSpentAsc()
                .orElseThrow(() -> AppException.notFound("Hạng thành viên không tồn tại"));

        // Tạo người dùng mới
        User user = new User();
        user.setFullName(fullName);
        user.setEmail(email);
        user.setPassword(password);
        user.setPhoneNumber(phoneNumber);
        user.setAccountBalance(BigDecimal.ZERO);
        user.setTotalSpent(BigDecimal.ZERO);
        user.setCreatedAt(LocalDateTime.now());
        user.setRole(role);
        user.setMembershipLevel(membershipLevel);

        user.setStatus(User.UserStatus.ACTIVE);
        User savedUser = userRepository.save(user);

        auditLogService.log(
                savedUser.getId(),
                "REGISTER_VERIFIED",
                AuditLog.TargetType.USER,
                savedUser.getId(),
                "Người dùng #" + savedUser.getId()
                        + " xác thực OTP đăng ký thành công. Tài khoản được kích hoạt."
        );

        // Xoá OTP khỏi Redis
        redisTemplate.delete(key);
        clearOtpAttempt("register", email);
    }

    @Override
    public AuthResponse login(LoginRequest request, HttpServletResponse response) {
        String email = normalizeEmail(request.getEmail());
        assertLoginAllowed(email);

        // Tìm user theo email
        User user = userRepository.findByEmail(email)
                .orElse(null);

        if (user == null) {
            recordFailedLogin(email);
            auditLogService.log(
                    null,
                    "LOGIN_FAILED",
                    AuditLog.TargetType.USER,
                    null,
                    "Đăng nhập thất bại. Không tìm thấy tài khoản phù hợp với thông tin đăng nhập: "
                            + email
            );

            throw AppException.unauthorized("Email hoặc mật khẩu không đúng");
        };

        // Kiểm tra mật khẩu
        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            recordFailedLogin(email);
            auditLogService.log(
                    user.getId(),
                    "LOGIN_FAILED",
                    AuditLog.TargetType.USER,
                    user.getId(),
                    "Đăng nhập thất bại cho user #" + user.getId()
                            + ". Lý do: thông tin đăng nhập không hợp lệ."
            );

            throw AppException.unauthorized("Email hoặc mật khẩu không đúng");
        }

        // Kiểm tra trạng thái tài khoản
        if (user.getStatus() != User.UserStatus.ACTIVE) {
            auditLogService.log(
                    user.getId(),
                    "LOGIN_FAILED",
                    AuditLog.TargetType.USER,
                    user.getId(),
                    "Đăng nhập thất bại cho user #" + user.getId()
                            + ". Lý do: trạng thái tài khoản hiện tại là " + user.getStatus() + "."
            );

            throw AppException.forbidden("Tài khoản chưa kích hoạt hoặc đã bị khóa");
        }
        clearFailedLogin(email);

        // Refresh membership level based on current totalSpent
        membershipService.refreshUserMembership(user);
        userRepository.save(user);

        String sessionId = createSessionId();

        // Tạo access token
        String accessToken = jwtUtil.generateToken(user.getEmail(), user.getRole().getName(), sessionId);

        // Tạo refresh token
        String refreshToken = jwtUtil.generateRefreshToken(user.getEmail(), sessionId);

        storeRefreshToken(user.getEmail(), sessionId, refreshToken);
        addRefreshTokenCookie(response, refreshToken, 86400);

        auditLogService.log(
                user.getId(),
                "LOGIN_SUCCESS",
                AuditLog.TargetType.USER,
                user.getId(),
                "Người dùng #" + user.getId() + " đăng nhập thành công."
        );

        UserResponse userResponse = UserResponse.builder()
                .id(user.getId())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .phoneNumber(user.getPhoneNumber())
                .avatar(user.getAvatar())
                .role(user.getRole().getName())
                .membershipLevel(user.getMembershipLevel() != null ? user.getMembershipLevel().getName() : null)
                .mustChangePassword(user.getMustChangePassword())
                .build();

        return AuthResponse.builder()
                .accessToken(accessToken)
                .user(userResponse)
                .build();
    }

    @Override
    public void logout(HttpServletRequest request, HttpServletResponse response) {
        clearRefreshTokenCookie(response);

        // Xóa refresh token khỏi Redis
        String email = getCurrentAuthenticatedEmail();
        String sessionId = getCurrentAuthenticatedSessionId();
        if (request.getCookies() != null){
            for (Cookie cookie : request.getCookies()){
                if ("refreshToken".equals(cookie.getName())) {
                    email = jwtUtil.extractEmail(cookie.getValue());
                    sessionId = jwtUtil.extractTokenId(cookie.getValue());
                    break;
                }
            }
        }

        if (email != null) {
            if (sessionId != null) {
                revokeRefreshToken(email, sessionId);
            } else {
                revokeAllRefreshTokens(email);
            }

            userRepository.findByEmail(email).ifPresent(user ->
                    auditLogService.log(
                            user.getId(),
                            "LOGOUT_SUCCESS",
                            AuditLog.TargetType.USER,
                            user.getId(),
                            "Người dùng #" + user.getId() + " đăng xuất thành công."
                    )
            );
        }
    }

    @Override
    public AuthResponse refresh(HttpServletRequest request, HttpServletResponse response) {
        // Lấy refresh token từ cookie
        String refreshToken = null;
        if (request.getCookies() != null) {
            for (Cookie cookie : request.getCookies()) {
                if (cookie.getName().equals("refreshToken")) {
                    refreshToken = cookie.getValue();
                    break;
                }
            }
        }

        if (refreshToken == null){
            throw AppException.unauthorized("Refresh token không tồn tại");
        }

        // Validate refresh token
        if (!jwtUtil.isTokenValid(refreshToken)){
            throw AppException.unauthorized("Refresh token không hợp lệ hoặc đã hết hạn");
        }

        // Lấy email từ refresh token
        String email = jwtUtil.extractEmail(refreshToken);
        String sessionId = jwtUtil.extractTokenId(refreshToken);
        if (sessionId == null) {
            throw AppException.unauthorized("Refresh token không hợp lệ");
        }

        // Kiểm tra refresh token có tồn tại trong Redis không
        String key = buildRefreshTokenKey(email, sessionId);
        String savedToken = redisTemplate.opsForValue().get(key);
        if (savedToken == null || !savedToken.equals(refreshToken)) {
            throw AppException.unauthorized("Refresh token không hợp lệ");
        }

        // Tìm user
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> AppException.notFound("Người dùng không tồn tại"));

        // Refresh membership level
        membershipService.refreshUserMembership(user);
        userRepository.save(user);

        // Kiểm tra trạng thái tài khoản
        if (user.getStatus() != User.UserStatus.ACTIVE) {
            throw new AppException(HttpStatus.FORBIDDEN, "Tài khoản của bạn không ở trạng thái hoạt động");
        }

        String newSessionId = createSessionId();

        // Tạo access token mới
        String newAccessToken = jwtUtil.generateToken(user.getEmail(), user.getRole().getName(), newSessionId);

        String newRefreshToken = jwtUtil.generateRefreshToken(user.getEmail(), newSessionId);
        revokeRefreshToken(user.getEmail(), sessionId);
        storeRefreshToken(user.getEmail(), newSessionId, newRefreshToken);
        addRefreshTokenCookie(response, newRefreshToken, 86400);

        UserResponse userResponse = UserResponse.builder()
                .id(user.getId())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .phoneNumber(user.getPhoneNumber())
                .avatar(user.getAvatar())
                .status(user.getStatus().name())
                .role(user.getRole().getName())
                .membershipLevel(user.getMembershipLevel() != null ? user.getMembershipLevel().getName() : null)
                .mustChangePassword(user.getMustChangePassword())
                .build();

        return AuthResponse.builder()
                .accessToken(newAccessToken)
                .user(userResponse)
                .build();
    }

    private void addRefreshTokenCookie(HttpServletResponse response, String refreshToken, long maxAgeSeconds) {
        ResponseCookie refreshCookie = ResponseCookie.from("refreshToken", refreshToken)
                .httpOnly(true)
                .secure(secureCookies)
                .sameSite("Lax")
                .path("/api/auth/refresh")
                .maxAge(Duration.ofSeconds(maxAgeSeconds))
                .build();
        response.addHeader("Set-Cookie", refreshCookie.toString());
    }

    private void clearRefreshTokenCookie(HttpServletResponse response) {
        ResponseCookie refreshCookie = ResponseCookie.from("refreshToken", "")
                .httpOnly(true)
                .secure(secureCookies)
                .sameSite("Lax")
                .path("/api/auth/refresh")
                .maxAge(Duration.ZERO)
                .build();
        response.addHeader("Set-Cookie", refreshCookie.toString());
    }

    private String createSessionId() {
        return UUID.randomUUID().toString();
    }

    private String buildRefreshTokenKey(String email, String sessionId) {
        return "refreshToken:" + normalizeEmail(email) + ":" + sessionId;
    }

    private String buildRefreshSessionsKey(String email) {
        return "refreshSessions:" + normalizeEmail(email);
    }

    private void storeRefreshToken(String email, String sessionId, String refreshToken) {
        String normalizedEmail = normalizeEmail(email);
        redisTemplate.opsForValue().set(buildRefreshTokenKey(normalizedEmail, sessionId), refreshToken, REFRESH_TOKEN_TTL_DAYS, TimeUnit.DAYS);
        redisTemplate.opsForSet().add(buildRefreshSessionsKey(normalizedEmail), sessionId);
        redisTemplate.expire(buildRefreshSessionsKey(normalizedEmail), REFRESH_TOKEN_TTL_DAYS, TimeUnit.DAYS);
    }

    private void revokeRefreshToken(String email, String sessionId) {
        String normalizedEmail = normalizeEmail(email);
        redisTemplate.delete(buildRefreshTokenKey(normalizedEmail, sessionId));
        redisTemplate.opsForSet().remove(buildRefreshSessionsKey(normalizedEmail), sessionId);
    }

    private void revokeAllRefreshTokens(String email) {
        String normalizedEmail = normalizeEmail(email);
        String sessionsKey = buildRefreshSessionsKey(normalizedEmail);
        Set<String> sessionIds = redisTemplate.opsForSet().members(sessionsKey);
        if (sessionIds != null && !sessionIds.isEmpty()) {
            sessionIds.forEach(sessionId -> redisTemplate.delete(buildRefreshTokenKey(normalizedEmail, sessionId)));
        }
        redisTemplate.delete(sessionsKey);
    }

    private String getCurrentAuthenticatedEmail() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || authentication.getName() == null || "anonymousUser".equals(authentication.getName())) {
            return null;
        }
        return authentication.getName();
    }

    private String getCurrentAuthenticatedSessionId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getDetails() instanceof String sessionId)) {
            return null;
        }
        return sessionId;
    }

    private String normalizeEmail(String email) {
        return email == null ? null : email.trim().toLowerCase();
    }

    private String buildOtpKey(String purpose, String email) {
        return "otp:" + purpose + ":" + normalizeEmail(email);
    }

    private String buildOtpAttemptKey(String purpose, String email) {
        return "otpAttempt:" + purpose + ":" + normalizeEmail(email);
    }

    private String buildOtpSendEmailRateKey(String purpose, String email) {
        return "rate:otp:send:" + purpose + ":email:" + normalizeEmail(email);
    }

    private String buildOtpSendIpRateKey(String purpose, String ip) {
        return "rate:otp:send:" + purpose + ":ip:" + ip;
    }

    private String buildLoginEmailRateKey(String email) {
        return "rate:login:email:" + normalizeEmail(email);
    }

    private String buildLoginIpRateKey(String ip) {
        return "rate:login:ip:" + ip;
    }

    private void assertOtpSendAllowed(String purpose, String email) {
        String ip = getCurrentClientIp();
        rateLimitService.checkLimit(
                buildOtpSendEmailRateKey(purpose, email),
                OTP_SEND_EMAIL_LIMIT,
                OTP_SEND_RATE_WINDOW,
                "Bạn đã yêu cầu gửi OTP quá nhiều lần, vui lòng thử lại sau"
        );
        rateLimitService.checkLimit(
                buildOtpSendIpRateKey(purpose, ip),
                OTP_SEND_IP_LIMIT,
                OTP_SEND_RATE_WINDOW,
                "Thiết bị hoặc mạng của bạn gửi OTP quá nhiều lần, vui lòng thử lại sau"
        );
    }

    private void recordInvalidOtp(String purpose, String email) {
        String attemptKey = buildOtpAttemptKey(purpose, email);
        long attempts = rateLimitService.hit(attemptKey, OTP_ATTEMPT_WINDOW);
        if (attempts >= OTP_ATTEMPT_LIMIT) {
            redisTemplate.delete(buildOtpKey(purpose, email));
            throw AppException.tooManyRequests("Bạn đã nhập sai OTP quá nhiều lần, vui lòng gửi lại mã mới");
        }
    }

    private void clearOtpAttempt(String purpose, String email) {
        rateLimitService.reset(buildOtpAttemptKey(purpose, email));
    }

    private void assertLoginAllowed(String email) {
        String ip = getCurrentClientIp();
        if (rateLimitService.isLimited(buildLoginEmailRateKey(email), LOGIN_EMAIL_LIMIT)
                || rateLimitService.isLimited(buildLoginIpRateKey(ip), LOGIN_IP_LIMIT)) {
            auditLogService.log(
                    null,
                    "LOGIN_RATE_LIMITED",
                    AuditLog.TargetType.USER,
                    null,
                    "Đăng nhập bị chặn do thử sai quá nhiều lần: " + email
            );
            throw AppException.tooManyRequests("Bạn đăng nhập sai quá nhiều lần, vui lòng thử lại sau");
        }
    }

    private void recordFailedLogin(String email) {
        String ip = getCurrentClientIp();
        rateLimitService.hit(buildLoginEmailRateKey(email), LOGIN_RATE_WINDOW);
        rateLimitService.hit(buildLoginIpRateKey(ip), LOGIN_RATE_WINDOW);
    }

    private void clearFailedLogin(String email) {
        rateLimitService.reset(buildLoginEmailRateKey(email));
    }

    private String getCurrentClientIp() {
        ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        if (attributes == null) {
            return "unknown";
        }

        HttpServletRequest request = attributes.getRequest();
        String forwardedFor = request.getHeader("X-Forwarded-For");
        if (forwardedFor != null && !forwardedFor.isBlank()) {
            return forwardedFor.split(",")[0].trim();
        }

        String realIp = request.getHeader("X-Real-IP");
        if (realIp != null && !realIp.isBlank()) {
            return realIp.trim();
        }

        return request.getRemoteAddr() != null ? request.getRemoteAddr() : "unknown";
    }

    @Override
    public void forgotPassword(ForgotPasswordRequest request){
        String email = normalizeEmail(request.getEmail());
        assertOtpSendAllowed("reset", email);

        // Kiểm tra email tồn tại
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> AppException.badRequest("Email không tồn tại trong hệ thống"));

        // Kiểm tra tài khoản có bị khóa không
        if (user.getStatus() == User.UserStatus.BANNED) {
            throw new AppException(HttpStatus.FORBIDDEN, "Tài khoản của bạn đã bị khóa");
        }

        // Tạo OTP 6 số
        String otp = String.format("%06d", new Random().nextInt(999999));

        // Lưu OTP vào Redis (5 phút)
        String key = buildOtpKey("reset", email);
        redisTemplate.opsForValue().set(key, otp, OTP_TTL.toMillis(), TimeUnit.MILLISECONDS);

        // Gửi OTP qua email
        emailService.sendResetPasswordOtp(email, otp);

    }

    @Override
    public void resetPassword(ResetPasswordRequest request){
        String email = normalizeEmail(request.getEmail());

        // Kiểm tra OTP còn tồn tại không
        String key = buildOtpKey("reset", email);
        String savedOtp = redisTemplate.opsForValue().get(key);

        if (savedOtp == null) {
            throw AppException.badRequest("OTP đã hết hạn, vui lòng thử lại");
        }

        // Kiểm tra OTP có đúng không
        if (!savedOtp.equals(request.getOtp())) {
            recordInvalidOtp("reset", email);
            throw AppException.badRequest("OTP không chính xác");
        }
        clearOtpAttempt("reset", email);

        // Tìm user theo email
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> AppException.badRequest("Email không tồn tại"));

        // Cập nhật mật khẩu mới
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        auditLogService.log(
                user.getId(),
                "PASSWORD_RESET",
                AuditLog.TargetType.USER,
                user.getId(),
                "Người dùng #" + user.getId()
                        + " đặt lại mật khẩu thành công bằng OTP."
        );

        // Xóa OTP khỏi Redis
        redisTemplate.delete(key);
        clearOtpAttempt("reset", email);

        // Xóa refresh token khỏi Redis (nếu có) để bắt buộc đăng nhập lại sau khi đổi mật khẩu
        revokeAllRefreshTokens(email);
    }

    @Override
    public void requestChangePasswordOtp(String email) {
        String normalizedEmail = normalizeEmail(email);
        assertOtpSendAllowed("change-password", normalizedEmail);

        User user = userRepository.findByEmail(normalizedEmail)
                .orElseThrow(() -> AppException.notFound("Không tìm thấy người dùng"));

        if (user.getStatus() != User.UserStatus.ACTIVE) {
            throw new AppException(HttpStatus.FORBIDDEN, "Tài khoản của bạn không ở trạng thái hoạt động");
        }

        String otp = String.format("%06d", new Random().nextInt(999999));
        String key = buildOtpKey("change-password", normalizedEmail);
        redisTemplate.opsForValue().set(key, otp, OTP_TTL.toMillis(), TimeUnit.MILLISECONDS);
        emailService.sendChangePasswordOtp(user.getEmail(), otp);

        auditLogService.log(
                user.getId(),
                "CHANGE_PASSWORD_OTP_REQUESTED",
                AuditLog.TargetType.USER,
                user.getId(),
                "Người dùng #" + user.getId() + " yêu cầu OTP đổi mật khẩu."
        );
    }

    @Override
    public void changePassword(String email, ChangePasswordRequest request) {
        String normalizedEmail = normalizeEmail(email);

        // Kiểm tra mật khẩu mới và xác nhận có khớp không
        if (!request.getNewPassword().equals(request.getConfirmPassword())) {
            throw AppException.badRequest("Mật khẩu xác nhận không khớp");
        }

        // Tìm user
        User user = userRepository.findByEmail(normalizedEmail)
                .orElseThrow(() -> AppException.notFound("Không tìm thấy người dùng"));

        // Kiểm tra mật khẩu mới không được trùng mật khẩu hiện tại
        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            throw AppException.badRequest("Mật khẩu hiện tại không đúng");
        }

        if (passwordEncoder.matches(request.getNewPassword(), user.getPassword())) {
            throw AppException.badRequest("Mật khẩu mới không được trùng mật khẩu hiện tại");
        }

        String otpKey = buildOtpKey("change-password", normalizedEmail);
        String savedOtp = redisTemplate.opsForValue().get(otpKey);

        if (savedOtp == null) {
            throw AppException.badRequest("OTP đã hết hạn hoặc không tồn tại, vui lòng gửi lại mã");
        }

        if (!savedOtp.equals(request.getOtp())) {
            recordInvalidOtp("change-password", normalizedEmail);
            throw AppException.badRequest("OTP không chính xác");
        }
        clearOtpAttempt("change-password", normalizedEmail);

        // Cập nhật mật khẩu mới
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        user.setMustChangePassword(false);
        userRepository.save(user);

        auditLogService.log(
                user.getId(),
                "CHANGE_PASSWORD",
                AuditLog.TargetType.USER,
                user.getId(),
                "Người dùng #" + user.getId()
                        + " đổi mật khẩu thành công khi đang đăng nhập."
        );

        redisTemplate.delete(otpKey);
        clearOtpAttempt("change-password", normalizedEmail);

        // Xóa refreshToken khỏi Redis để bắt buộc đăng nhập lại sau khi đổi mật khẩu
        revokeAllRefreshTokens(normalizedEmail);
    }
}





