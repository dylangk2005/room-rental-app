package com.roomrental.api.post.job;

import com.roomrental.api.post.entity.Post.PostStatus;
import com.roomrental.api.post.entity.Post;
import com.roomrental.api.post.repository.PostRepository;
import java.time.LocalDateTime;
import lombok.extern.slf4j.Slf4j;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

// Job này sẽ chạy hàng ngày vào lúc 00:00 để tự động chuyển trạng thái của các bài đăng đã hết hạn sang EXPIRED
@Component
@RequiredArgsConstructor
@Slf4j
public class PostExpirationJob {

    private final PostRepository postRepository;

    // Cron expression: 0 55 1 * * * (chạy vào lúc 1 giờ 55 phút hàng ngày)
    @Scheduled(cron = "${post.expiration.cron:0 0 0 * * *}")
    @Transactional
    public void expireActivePosts() {
        LocalDateTime now = LocalDateTime.now();

        int expiredCount = postRepository.expireActivePosts(
                Post.PostStatus.ACTIVE,
                Post.PostStatus.EXPIRED,
                now
        );

        if (expiredCount > 0) {
            log.info("Đã chuyển {} bài đăng quá hạn sang EXPIRED", expiredCount);
        }
    }
}
