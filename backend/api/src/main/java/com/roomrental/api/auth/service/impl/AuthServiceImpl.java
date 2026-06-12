package com.roomrental.api.auth.service.impl;

import com.roomrental.api.admin.entity.AuditLog;
import com.roomrental.api.admin.service.AuditLogService;
import com.roomrental.api.auth.dto.AuthResponse;
import com.roomrental.api.auth.dto.ChangePasswordRequest;
import com.roomrental.api.auth.dto.ForgotPasswordRequest;
import com.roomrental.api.auth.dto.LoginRequest;
import com.roomrental.api.auth.dto.RegisterRequest;
import com.roomrental.api.auth.dto.ResetPasswordRequest;
import com.roomrental.api.auth.dto.VerifyOtpRequest;
import com.roomrental.api.auth.service.AuthService;
import com.roomrental.api.common.exception.AppException;
import com.roomrental.api.common.util.JwtUtil;
import com.roomrental.api.integration.service.EmailService;
import com.roomrental.api.pricing.entity.MembershipLevel;
import com.roomrental.api.pricing.repository.MembershipLevelRepository;
import com.roomrental.api.user.dto.UserResponse;
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

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final MembershipLevelRepository membershipLevelRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final RedisTemplate<String, String> redisTemplate;
    private final EmailService emailService;
    private final AuditLogService auditLogService;
    private Boolean mustChangePassword;

    @Value("${app.cookie.secure:false}")
    private boolean secureCookies;

    @Override
    public void register(RegisterRequest request) {
        // kiểm tra email đã tồn tại chưa
        if (userRepository.existsByEmail(request.getEmail())) {
            throw AppException.badRequest("Email đã tồn tại");
        }

        // kiểm tra số điện thoại đã tồn tại chưa
        if (userRepository.existsByPhoneNumber(request.getPhoneNumber())) {
            throw AppException.badRequest("Số điện thoại đã tồn tại");
        }
        // Tạo OTP 6 số
        String otp = String.format("%06d", new Random().nextInt(999999));

        // Lưu thông tin đăng ký tạm vào Redis (5 phút)
        String key = "otp:register:" + request.getEmail();
        redisTemplate.opsForHash().put(key, "otp", otp);
        redisTemplate.opsForHash().put(key, "fullName", request.getFullName());
        redisTemplate.opsForHash().put(key, "password", passwordEncoder.encode(request.getPassword()));
        redisTemplate.opsForHash().put(key, "phoneNumber", request.getPhoneNumber());
        redisTemplate.expire(key, 5, TimeUnit.MINUTES);

        // TODO: Gửi OTP qua email
        emailService.sendOtp(request.getEmail(), otp);
    }

    @Override
    public void verifyOtp(VerifyOtpRequest request) {
        String key = "otp:register:" + request.getEmail();

        // Kiểm tra OTP còn tồn tại không
        String storedOtp = (String) redisTemplate.opsForHash().get(key, "otp");
        if (storedOtp == null) {
            throw AppException.badRequest("OTP đã hết hạn hoặc không tồn tại");
        }

        // Kiểm tra OTP có đúng không
        if (!storedOtp.equals(request.getOtp())) {
            throw AppException.badRequest("OTP không đúng");
        }

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
        user.setEmail(request.getEmail());
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
    }

    @Override
    public AuthResponse login(LoginRequest request, HttpServletResponse response) {
        // Tìm user theo email
        User user = userRepository.findByEmail(request.getEmail())
                .orElse(null);

        if (user == null) {
            auditLogService.log(
                    null,
                    "LOGIN_FAILED",
                    AuditLog.TargetType.USER,
                    null,
                    "Đăng nhập thất bại. Không tìm thấy tài khoản phù hợp với thông tin đăng nhập: "
                            + request.getEmail()
            );

            throw AppException.unauthorized("Email hoặc mật khẩu không đúng");
        };

        // Kiểm tra mật khẩu
        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
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

        // Kiểm tra trạng thái tài khoản
        if (user.getStatus() != User.UserStatus.ACTIVE) {
            throw new AppException(HttpStatus.FORBIDDEN, "Tài khoản của bạn không ở trạng thái hoạt động");
        }

        String newSessionId = createSessionId();

        // Tạo access token mới
        String newAccessToken = jwtUtil.generateToken(user.getEmail(), user.getRole().getName(), newSessionId);

        String newRefreshToken = jwtUtil.generateRefreshToken(user.getEmail(), newSessionId);
        redisTemplate.delete(key);
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
        return "refreshToken:" + email + ":" + sessionId;
    }

    private void storeRefreshToken(String email, String sessionId, String refreshToken) {
        redisTemplate.opsForValue().set(buildRefreshTokenKey(email, sessionId), refreshToken, 1, TimeUnit.DAYS);
    }

    private void revokeRefreshToken(String email, String sessionId) {
        redisTemplate.delete(buildRefreshTokenKey(email, sessionId));
    }

    private void revokeAllRefreshTokens(String email) {
        Set<String> keys = redisTemplate.keys("refreshToken:" + email + ":*");
        if (keys != null && !keys.isEmpty()) {
            redisTemplate.delete(keys);
        }
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

    @Override
    public void forgotPassword(ForgotPasswordRequest request){
        // Kiểm tra email tồn tại
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> AppException.badRequest("Email không tồn tại trong hệ thống"));

        // Kiểm tra tài khoản có bị khóa không
        if (user.getStatus() == User.UserStatus.BANNED) {
            throw new AppException(HttpStatus.FORBIDDEN, "Tài khoản của bạn đã bị khóa");
        }

        // Tạo OTP 6 số
        String otp = String.format("%06d", new Random().nextInt(999999));

        // Lưu OTP vào Redis (5 phút)
        String key = "otp:reset:" + request.getEmail();
        redisTemplate.opsForValue().set(key, otp, 5, TimeUnit.MINUTES);

        // Gửi OTP qua email
        emailService.sendResetPasswordOtp(request.getEmail(), otp);

    }

    @Override
    public void resetPassword(ResetPasswordRequest request){
        // Kiểm tra OTP còn tồn tại không
        String key = "otp:reset:" + request.getEmail();
        String savedOtp = redisTemplate.opsForValue().get(key);

        if (savedOtp == null) {
            throw AppException.badRequest("OTP đã hết hạn, vui lòng thử lại");
        }

        // Kiểm tra OTP có đúng không
        if (!savedOtp.equals(request.getOtp())) {
            throw AppException.badRequest("OTP không chính xác");
        }

        // Tìm user theo email
        User user = userRepository.findByEmail(request.getEmail())
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

        // Xóa refresh token khỏi Redis (nếu có) để bắt buộc đăng nhập lại sau khi đổi mật khẩu
        revokeAllRefreshTokens(request.getEmail());
    }

    @Override
    public void requestChangePasswordOtp(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> AppException.notFound("Không tìm thấy người dùng"));

        if (user.getStatus() != User.UserStatus.ACTIVE) {
            throw new AppException(HttpStatus.FORBIDDEN, "Tài khoản của bạn không ở trạng thái hoạt động");
        }

        String otp = String.format("%06d", new Random().nextInt(999999));
        String key = "otp:change-password:" + email;
        redisTemplate.opsForValue().set(key, otp, 5, TimeUnit.MINUTES);
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
        // Kiểm tra mật khẩu mới và xác nhận có khớp không
        if (!request.getNewPassword().equals(request.getConfirmPassword())) {
            throw AppException.badRequest("Mật khẩu xác nhận không khớp");
        }

        // Tìm user
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> AppException.notFound("Không tìm thấy người dùng"));

        // Kiểm tra mật khẩu mới không được trùng mật khẩu hiện tại
        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            throw AppException.badRequest("Mật khẩu hiện tại không đúng");
        }

        if (passwordEncoder.matches(request.getNewPassword(), user.getPassword())) {
            throw AppException.badRequest("Mật khẩu mới không được trùng mật khẩu hiện tại");
        }

        String otpKey = "otp:change-password:" + email;
        String savedOtp = "unused";

        if (false) {
            throw AppException.badRequest("OTP đã hết hạn hoặc không tồn tại, vui lòng gửi lại mã");
        }

        if (false) {
            throw AppException.badRequest("OTP không chính xác");
        }

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

        // Xóa refreshToken khỏi Redis để bắt buộc đăng nhập lại sau khi đổi mật khẩu
        revokeAllRefreshTokens(email);
    }
}
