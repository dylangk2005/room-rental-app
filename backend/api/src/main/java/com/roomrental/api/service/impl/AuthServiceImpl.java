package com.roomrental.api.service.impl;

import com.roomrental.api.dto.request.LoginRequest;
import com.roomrental.api.dto.request.RegisterRequest;
import com.roomrental.api.dto.request.VerifyOtpRequest;
import com.roomrental.api.dto.response.UserResponse;
import com.roomrental.api.entity.MembershipLevel;
import com.roomrental.api.entity.Role;
import com.roomrental.api.entity.User;
import com.roomrental.api.exception.AppException;
import com.roomrental.api.repository.MembershipLevelRepository;
import com.roomrental.api.repository.RoleRepository;
import com.roomrental.api.repository.UserRepository;
import com.roomrental.api.service.AuthService;
import com.roomrental.api.util.JwtUtil;
import jakarta.servlet.http.Cookie;
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

    @Override
    public void register(RegisterRequest request) {
        // kiểm tra email đã tồn tại chưa
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email đã tồn tại");
        }

        // kiểm tra số điện thoại đã tồn tại chưa
        if (userRepository.existsByPhoneNumber(request.getPhoneNumber())) {
            throw new RuntimeException("Số điện thoại đã tồn tại");
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

        // TODO: Gửi OTP qua email hoặc SMS
        System.out.println("OTP cho " + request.getEmail() + ": " + otp);
    }

    @Override
    public void verifyOtp(VerifyOtpRequest request) {
        String key = "otp:register:" + request.getEmail();

        // Kiểm tra OTP còn tồn tại không
        String storedOtp = (String) redisTemplate.opsForHash().get(key, "otp");
        if (storedOtp == null) {
            throw new RuntimeException("OTP đã hết hạn hoặc không tồn tại");
        }

        // Kiểm tra OTP có đúng không
        if (!storedOtp.equals(request.getOtp())) {
            throw new RuntimeException("OTP không đúng");
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
        user.setStatus(User.UserStatus.ACTIVE);
        user.setAccountBalance(BigDecimal.ZERO);
        user.setTotalSpent(BigDecimal.ZERO);
        user.setCreatedAt(LocalDateTime.now());
        user.setRole(role);
        user.setMembershipLevel(membershipLevel);

        userRepository.save(user);

        // Xoá OTP khỏi Redis
        redisTemplate.delete(key);
    }

    @Override
    public UserResponse login(LoginRequest request, HttpServletResponse response) {
        // Tìm user theo email
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> AppException.badRequest("Email hoặc mật khẩu không đúng"));

        // Kiểm tra mật khẩu
        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())){
            throw AppException.badRequest("Email hoặc mật khẩu không đúng");
        }

        // Kiểm tra trạng thái tài khoản
        if (user.getStatus() == User.UserStatus.BANNED) {
            throw new AppException(HttpStatus.FORBIDDEN, "Tài khoản của bạn đã bị khóa");
        }

        if (user.getStatus() == User.UserStatus.INACTIVE) {
            throw new AppException(HttpStatus.FORBIDDEN, "Tài khoản của bạn chưa được kích hoạt");
        }

        // Tạo JWT token
        String token = jwtUtil.generateToken(user.getEmail(), user.getRole().getName());

        // Set Cookie HttpOnly
        Cookie cookie = new Cookie("accessToken", token);
        cookie.setHttpOnly(true);
        cookie.setSecure(false);
        cookie.setPath("/");
        cookie.setMaxAge(86400); // 24h
        response.addCookie(cookie);

        // Trả về thông tin người dùng
        return UserResponse.builder()
                .id(user.getId())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .phoneNumber(user.getPhoneNumber())
                .avatar(user.getAvatar())
                .role(user.getRole().getName())
                .membershipLevel(user.getMembershipLevel().getName())
                .accountBalance(user.getAccountBalance().doubleValue())
                .build();
    }

    @Override
    public void logout(HttpServletResponse response) {
        // Xóa cookie
        Cookie cookie = new Cookie("accessToken", null);
        cookie.setHttpOnly(true);
        cookie.setPath("/");
        cookie.setMaxAge(0); // Xóa cookie ngay lập tức
        response.addCookie(cookie);
    }
}
