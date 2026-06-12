package com.roomrental.api.pricing.service.impl;

import com.roomrental.api.common.exception.AppException;
import com.roomrental.api.pricing.dto.MembershipLevelResponse;
import com.roomrental.api.pricing.dto.MyMembershipResponse;
import com.roomrental.api.pricing.entity.MembershipLevel;
import com.roomrental.api.pricing.repository.MembershipLevelRepository;
import com.roomrental.api.pricing.service.MembershipService;
import com.roomrental.api.user.entity.User;
import com.roomrental.api.user.repository.UserRepository;
import java.math.BigDecimal;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

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