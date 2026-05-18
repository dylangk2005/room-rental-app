package com.roomrental.api.service.impl;

import com.roomrental.api.dto.response.membership.MembershipLevelResponse;
import com.roomrental.api.dto.response.membership.MyMembershipResponse;
import com.roomrental.api.entity.MembershipLevel;
import com.roomrental.api.entity.User;
import com.roomrental.api.exception.AppException;
import com.roomrental.api.repository.MembershipLevelRepository;
import com.roomrental.api.repository.UserRepository;
import com.roomrental.api.service.MembershipService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
public class MembershipServiceImpl implements MembershipService {

    private final MembershipLevelRepository membershipLevelRepository;
    private final UserRepository userRepository;

    @Override
    public List<MembershipLevelResponse> getLevels() {
        return membershipLevelRepository.findAllByOrderByMinSpentAsc()
                .stream()
                .map(this::mapLevelResponse)
                .toList();
    }

    @Override
    public MyMembershipResponse getMyLevel(Integer userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> AppException.notFound("Không tìm thấy người dùng"));

        BigDecimal totalSpent = nullSafe(user.getTotalSpent());
        MembershipLevel currentLevel = user.getMembershipLevel();

        MembershipLevel nextLevel = membershipLevelRepository
                .findFirstByMinSpentGreaterThanOrderByMinSpentAsc(totalSpent)
                .orElse(null);

        return MyMembershipResponse.builder()
                .levelId(currentLevel != null ? currentLevel.getId() : null)
                .levelName(currentLevel != null ? currentLevel.getName() : null)
                .minSpent(currentLevel != null ? currentLevel.getMinSpent() : null)
                .discountPercent(currentLevel != null ? currentLevel.getDiscountPercent() : 0)
                .totalSpent(totalSpent)
                .nextLevelId(nextLevel != null ? nextLevel.getId() : null)
                .nextLevelName(nextLevel != null ? nextLevel.getName() : null)
                .nextLevelMinSpent(nextLevel != null ? nextLevel.getMinSpent() : null)
                .amountToNextLevel(nextLevel != null ? nextLevel.getMinSpent().subtract(totalSpent) : BigDecimal.ZERO)
                .build();
    }

    @Override
    public void refreshUserMembership(User user) {
        BigDecimal totalSpent = nullSafe(user.getTotalSpent());

        MembershipLevel newLevel = membershipLevelRepository
                .findTopByMinSpentLessThanEqualOrderByMinSpentDesc(totalSpent)
                .orElse(null);

        if (newLevel == null) {
            return;
        }

        MembershipLevel currentLevel = user.getMembershipLevel();
        if (currentLevel == null || !currentLevel.getId().equals(newLevel.getId())) {
            user.setMembershipLevel(newLevel);
        }
    }

    private MembershipLevelResponse mapLevelResponse(MembershipLevel level) {
        return MembershipLevelResponse.builder()
                .id(level.getId())
                .name(level.getName())
                .minSpent(level.getMinSpent())
                .discountPercent(level.getDiscountPercent())
                .build();
    }

    private BigDecimal nullSafe(BigDecimal value) {
        return value != null ? value : BigDecimal.ZERO;
    }
}