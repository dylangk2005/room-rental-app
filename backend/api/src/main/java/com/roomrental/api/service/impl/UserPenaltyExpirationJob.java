package com.roomrental.api.service.impl;

import com.roomrental.api.entity.User;
import com.roomrental.api.entity.UserPenalty;
import com.roomrental.api.repository.UserPenaltyRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Component
@RequiredArgsConstructor
public class UserPenaltyExpirationJob {

    private final UserPenaltyRepository userPenaltyRepository;

    @Scheduled(fixedDelay = 60 * 60 * 1000)
    @Transactional
    public void unlockExpiredTemporaryBans() {
        LocalDateTime now = LocalDateTime.now();

        userPenaltyRepository.findByTypeAndEndDateBefore(UserPenalty.PenaltyType.BAN_ACCOUNT, now)
                .forEach((penalty) -> {
                    User user = penalty.getUser();
                    if (user == null || user.getStatus() != User.UserStatus.BANNED) {
                        return;
                    }

                    long activeBans = userPenaltyRepository.countActivePenalties(
                            user.getId(),
                            UserPenalty.PenaltyType.BAN_ACCOUNT,
                            now
                    );

                    if (activeBans == 0) {
                        user.setStatus(User.UserStatus.ACTIVE);
                    }
                });
    }
}
