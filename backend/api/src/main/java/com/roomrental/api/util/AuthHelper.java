package com.roomrental.api.util;

import com.roomrental.api.entity.User;
import com.roomrental.api.exception.AppException;
import com.roomrental.api.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class AuthHelper {

    private final UserRepository userRepository;

    // dùng để lấy thông tin người dùng hiện tại, nếu không có sẽ ném ra ngoại lệ
    public User getCurrentUser() {
        String email = SecurityContextHolder.getContext()
                .getAuthentication()
                .getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> AppException.unauthorized("Không tìm thấy người dùng hiện tại"));
    }

    // Lấy id người dùng hiện tại
    public Integer getCurrentUserId() {
        return getCurrentUser().getId();
    }


    // dùng cho chức năng xem chi tiết bài đăng, người dùng có thể xem nội dung chi tiết nếu họ là chủ bài đăng hoặc có quyền quản trị
    public record CurrentUser(Integer id, String role) {
    }

    // Lấy thông tin người dùng hiện tại, nếu không có sẽ trả về null
    public CurrentUser getCurrentUserOrNull() {
        // Lấy thông tin người dùng hiện tại từ SecurityContext
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        // Nếu không có thông tin người dùng hoặc người dùng chưa đăng nhập, trả về null
        if (authentication == null
                || !authentication.isAuthenticated()
                || "anonymousUser".equals(authentication.getName())) {
            return null;
        }

        // Lấy email từ thông tin người dùng
        String email = authentication.getName();

        // Lấy id người dùng từ cơ sở dữ liệu
        Integer userId = userRepository.findByEmail(email)
                .map(User::getId)
                .orElse(null);

        // Nếu không tìm thấy người dùng, trả về null
        if (userId == null) {
            return null;
        }

        // Lấy vai trò người dùng từ thông tin người dùng, nếu không có sẽ trả về null
        String role = authentication.getAuthorities()
                .stream()
                .map(GrantedAuthority::getAuthority)
                .filter(authority -> authority.startsWith("ROLE_"))
                .map(authority -> authority.substring("ROLE_".length()))
                .findFirst()
                .orElse(null);

        return new CurrentUser(userId, role);
    }
}