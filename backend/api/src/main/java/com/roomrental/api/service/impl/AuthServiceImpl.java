package com.roomrental.api.service.impl;

import com.roomrental.api.dto.request.auth.*;
import com.roomrental.api.dto.response.user.UserResponse;
import com.roomrental.api.entity.AuditLog;
import com.roomrental.api.entity.MembershipLevel;
import com.roomrental.api.entity.Role;
import com.roomrental.api.entity.User;
import com.roomrental.api.exception.AppException;
import com.roomrental.api.repository.MembershipLevelRepository;
import com.roomrental.api.repository.RoleRepository;
import com.roomrental.api.repository.UserRepository;
import com.roomrental.api.service.AuditLogService;
import com.roomrental.api.service.AuthService;
import com.roomrental.api.service.EmailService;
import com.roomrental.api.util.JwtUtil;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Random;
import java.util.concurrent.TimeUnit;

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
        MembershipLevel membershipLevel = membershipLevelRepository.findById(1)
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
                "User #" + savedUser.getId()
                        + " xác thực OTP đăng ký thành công. Tài khoản được kích hoạt."
        );


        // Xoá OTP khỏi Redis
        redisTemplate.delete(key);
    }

    @Override
    public UserResponse login(LoginRequest request, HttpServletResponse response) {
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

        // Tạo access token
        String accessToken = jwtUtil.generateToken(user.getEmail(), user.getRole().getName());

        // Tạo refresh token
        String refreshToken = jwtUtil.generateRefreshToken(user.getEmail());

        // Lưu refresh token vào Redis (1 ngày)
        String key = "refreshToken:" + user.getEmail();
        redisTemplate.opsForValue().set(key, refreshToken, 1, TimeUnit.DAYS);

        //Set accessToken vào cookie
        Cookie accessCookie = new Cookie("accessToken", accessToken);
        accessCookie.setHttpOnly(true);
        accessCookie.setSecure(false);
        accessCookie.setPath("/");
        accessCookie.setMaxAge(900); // 15 phút
        response.addCookie(accessCookie);

        // Set refreshToken vào cookie
        Cookie refreshCookie = new Cookie("refreshToken", refreshToken);
        refreshCookie.setHttpOnly(true);
        refreshCookie.setSecure(false);
        refreshCookie.setPath("/api/auth/refresh"); // Chỉ gửi refresh token khi gọi endpoint refresh
        refreshCookie.setMaxAge(86400); // 24h
        response.addCookie(refreshCookie);

        auditLogService.log(
                user.getId(),
                "LOGIN_SUCCESS",
                AuditLog.TargetType.USER,
                user.getId(),
                "User #" + user.getId() + " đăng nhập thành công."
        );

        // Trả về thông tin người dùng
        return UserResponse.builder()
                .id(user.getId())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .phoneNumber(user.getPhoneNumber())
                .avatar(user.getAvatar())
                .role(user.getRole().getName())
                .membershipLevel(user.getMembershipLevel().getName())
                .build();
    }

    @Override
    public void logout(HttpServletRequest request, HttpServletResponse response) {
       // Xóa accessToken cookie
        Cookie accessCookie = new Cookie("accessToken", null);
        accessCookie.setHttpOnly(true);
        accessCookie.setPath("/");
        accessCookie.setMaxAge(0);
        response.addCookie(accessCookie);

        // Xóa refreshToken cookie
        Cookie refreshCookie = new Cookie("refreshToken", null);
        refreshCookie.setHttpOnly(true);
        refreshCookie.setPath("/api/auth/refresh");
        refreshCookie.setMaxAge(0);
        response.addCookie(refreshCookie);

        // Xóa refresh token khỏi Redis
        if (request.getCookies() != null){
            for (Cookie cookie : request.getCookies()){
                if ("refreshToken".equals(cookie.getName())) {
                    String email = jwtUtil.extractEmail(cookie.getValue());
                    redisTemplate.delete("refreshToken:" + email);

                    userRepository.findByEmail(email).ifPresent(user ->
                            auditLogService.log(
                                    user.getId(),
                                    "LOGOUT_SUCCESS",
                                    AuditLog.TargetType.USER,
                                    user.getId(),
                                    "User #" + user.getId() + " đăng xuất thành công."
                            )
                    );

                    break;
                }
            }
        }
    }

    @Override
    public UserResponse refresh(HttpServletRequest request, HttpServletResponse response) {
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

        // Kiểm tra refresh token có tồn tại trong Redis không
        String key = "refreshToken:" + email;
        String savedToken = redisTemplate.opsForValue().get(key);
        if (savedToken == null || !savedToken.equals(refreshToken)) {
            throw AppException.unauthorized("Refresh token không hợp lệ");
        }

        // Tìm user
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> AppException.notFound("Người dùng không tồn tại"));

        // Kiểm tra trạng thái tài khoản
        if (user.getStatus() == User.UserStatus.BANNED) {
            throw new AppException(HttpStatus.FORBIDDEN, "Tài khoản của bạn đã bị khóa");
        }

        // Tạo access token mới
        String newAccessToken = jwtUtil.generateToken(user.getEmail(), user.getRole().getName());

        // Set accessToken vào cookie
        Cookie accessCookie = new Cookie("accessToken", newAccessToken);
        accessCookie.setHttpOnly(true);
        accessCookie.setSecure(false);
        accessCookie.setPath("/");
        accessCookie.setMaxAge(900); // 15 phút
        response.addCookie(accessCookie);

        // return thông tin người dùng
        return UserResponse.builder()
                .id(user.getId())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .phoneNumber(user.getPhoneNumber())
                .avatar(user.getAvatar())
                .status(user.getStatus().name())
                .role(user.getRole().getName())
                .membershipLevel(user.getMembershipLevel().getName())
                .build();
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
                "User #" + user.getId()
                        + " đặt lại mật khẩu thành công bằng OTP."
        );

        // Xóa OTP khỏi Redis
        redisTemplate.delete(key);

        // Xóa refresh token khỏi Redis (nếu có) để bắt buộc đăng nhập lại sau khi đổi mật khẩu
        redisTemplate.delete("refreshToken:" + request.getEmail());
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

        // Kiểm tra mật khẩu cũ đúng không
        if (!passwordEncoder.matches(request.getOldPassword(), user.getPassword())) {
            throw AppException.badRequest("Mật khẩu cũ không chính xác");
        }

        // Kiểm tra mật khẩu mới không được trùng mật khẩu cũ
        if (passwordEncoder.matches(request.getNewPassword(), user.getPassword())) {
            throw AppException.badRequest("Mật khẩu mới không được trùng mật khẩu cũ");
        }

        // Cập nhật mật khẩu mới
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        auditLogService.log(
                user.getId(),
                "CHANGE_PASSWORD",
                AuditLog.TargetType.USER,
                user.getId(),
                "User #" + user.getId()
                        + " đổi mật khẩu thành công khi đang đăng nhập."
        );

        // Xóa refreshToken khỏi Redis để bắt buộc đăng nhập lại sau khi đổi mật khẩu
        redisTemplate.delete("refresh:" + email);
    }
}
