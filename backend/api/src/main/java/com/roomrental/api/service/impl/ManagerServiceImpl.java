package com.roomrental.api.service.impl;

import com.roomrental.api.dto.request.manager.UpdateMembershipLevelRequest;
import com.roomrental.api.dto.request.manager.UpdatePostTypePriceRequest;
import com.roomrental.api.entity.*;
import com.roomrental.api.exception.AppException;
import com.roomrental.api.repository.MembershipLevelRepository;
import com.roomrental.api.repository.PostTypePriceRepository;
import com.roomrental.api.repository.UserPenaltyRepository;
import com.roomrental.api.repository.UserRepository;
import com.roomrental.api.service.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

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
