package com.roomrental.api.user.job;

import com.roomrental.api.user.entity.User;
import com.roomrental.api.user.entity.UserPenalty;
import com.roomrental.api.user.repository.UserPenaltyRepository;
import java.time.LocalDateTime;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@RequiredArgsConstructor
public class UserPenaltyExpirationJob {

    private final UserPenaltyRepository userPenaltyRepository;

    @Scheduled(fixedDelay = 60 * 60 * 1000)
    @Transactional
    public void unlockExpiredTemporaryBans() {
        LocalDateTime now = LocalDateTime.now();

        userPenaltyRepository.findByTypeAndEndDateBefore(UserPenalty.PenaltyType.BAN_ACCOUNT, now)
                .stream()
                .filter(p -> p.getIsActive() == null || p.getIsActive())
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