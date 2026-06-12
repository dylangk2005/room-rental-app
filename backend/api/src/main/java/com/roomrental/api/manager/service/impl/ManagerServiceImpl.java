package com.roomrental.api.manager.service.impl;

import com.roomrental.api.admin.entity.AuditLog;
import com.roomrental.api.admin.service.AuditLogService;
import com.roomrental.api.common.exception.AppException;
import com.roomrental.api.manager.service.ManagerService;
import com.roomrental.api.notification.entity.Notification;
import com.roomrental.api.notification.service.NotificationService;
import com.roomrental.api.post.entity.Post;
import com.roomrental.api.pricing.dto.UpdateMembershipLevelRequest;
import com.roomrental.api.pricing.dto.UpdatePostTypePriceRequest;
import com.roomrental.api.pricing.entity.MembershipLevel;
import com.roomrental.api.pricing.entity.PostTypePrice;
import com.roomrental.api.pricing.entity.PostTypePriceId;
import com.roomrental.api.pricing.repository.MembershipLevelRepository;
import com.roomrental.api.pricing.repository.PostTypePriceRepository;
import com.roomrental.api.user.entity.User;
import com.roomrental.api.user.entity.UserPenalty;
import com.roomrental.api.user.repository.UserPenaltyRepository;
import com.roomrental.api.user.repository.UserRepository;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ManagerServiceImpl implements ManagerService {

    private final UserRepository userRepository;
    private final UserPenaltyRepository userPenaltyRepository;
    private final AuditLogService auditLogService;
    private final NotificationService notificationService;
    private final PostTypePriceRepository postTypePriceRepository;
    private final MembershipLevelRepository membershipLevelRepository;

    @Override
    @Transactional
    public void unbanUser(Integer managerId, Integer userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> AppException.notFound("Không tìm thấy người dùng"));

        user.setStatus(User.UserStatus.ACTIVE);

        userPenaltyRepository.deleteByUserIdAndTypeIn(
                userId,
                List.of(UserPenalty.PenaltyType.BAN_ACCOUNT, UserPenalty.PenaltyType.LOCK_POST)
        );

        auditLogService.log(
                managerId,
                "UNBAN_USER",
                AuditLog.TargetType.USER,
                userId,
                "Quản lý mở khóa tài khoản"
        );

        notificationService.notifyUser(
                userId,
                Notification.NotificationType.SYSTEM_INFORMATION,
                "Tài khoản của bạn đã được mở khóa."
        );
    }

    @Override
    @Transactional
    public void updatePostTypePrice(Integer managerId, UpdatePostTypePriceRequest request) {
        PostTypePriceId id = new PostTypePriceId(request.getPostTypeId(), request.getDays());

        PostTypePrice price = postTypePriceRepository.findById(id)
                .orElseThrow(() -> AppException.notFound("Không tìm thấy cấu hình giá"));

        price.setPrice(request.getPrice());

        auditLogService.log(
                managerId,
                "UPDATE_POST_TYPE_PRICE",
                AuditLog.TargetType.POST,
                request.getPostTypeId(),
                "Cập nhật giá loại tin #" + request.getPostTypeId()
                        + " trong " + request.getDays() + " ngày: " + request.getPrice()
        );
    }

    @Override
    @Transactional
    public void updateMembershipLevel(Integer managerId, Integer id, UpdateMembershipLevelRequest request) {
        MembershipLevel level = membershipLevelRepository.findById(id)
                .orElseThrow(() -> AppException.notFound("Không tìm thấy hạng thành viên"));

        level.setMinSpent(request.getMinSpent());
        level.setDiscountPercent(request.getDiscountPercent());

        auditLogService.log(
                managerId,
                "UPDATE_MEMBERSHIP_LEVEL",
                AuditLog.TargetType.MEMBERSHIP,
                id,
                "Cập nhật hạng " + level.getName()
        );
    }
}