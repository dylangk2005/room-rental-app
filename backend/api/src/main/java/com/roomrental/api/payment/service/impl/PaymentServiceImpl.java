package com.roomrental.api.payment.service.impl;

import com.roomrental.api.admin.entity.AuditLog;
import com.roomrental.api.admin.service.AuditLogService;
import com.roomrental.api.common.exception.AppException;
import com.roomrental.api.notification.entity.Notification;
import com.roomrental.api.notification.service.NotificationService;
import com.roomrental.api.payment.dto.BoostPaymentRequest;
import com.roomrental.api.payment.dto.PaymentResponse;
import com.roomrental.api.payment.dto.PayPostRequest;
import com.roomrental.api.payment.dto.RenewPaymentRequest;
import com.roomrental.api.payment.entity.Payment;
import com.roomrental.api.payment.repository.PaymentRepository;
import com.roomrental.api.payment.service.PaymentService;
import com.roomrental.api.post.entity.Post.PostStatus;
import com.roomrental.api.post.entity.Post;
import com.roomrental.api.post.repository.PostRepository;
import com.roomrental.api.pricing.entity.MembershipLevel;
import com.roomrental.api.pricing.entity.PostTypePrice;
import com.roomrental.api.pricing.entity.PostTypePriceId;
import com.roomrental.api.pricing.repository.PostTypePriceRepository;
import com.roomrental.api.pricing.service.MembershipService;
import com.roomrental.api.user.entity.User;
import com.roomrental.api.user.repository.UserRepository;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class PaymentServiceImpl implements PaymentService {

    private static final BigDecimal VAT_RATE_PERCENT = BigDecimal.valueOf(8);

    private final UserRepository userRepository;
    private final PostRepository postRepository;
    private final PostTypePriceRepository postTypePriceRepository;
    private final PaymentRepository paymentRepository;
    private final NotificationService notificationService;
    private final AuditLogService auditLogService;
    private final MembershipService membershipService;

    @Override
    @Transactional
    public PaymentResponse payPost(Integer userId, PayPostRequest request) {
        LocalDateTime now = LocalDateTime.now();

        Post post = getPostForPayment(request.getPostId());

        if (!post.getUser().getId().equals(userId)) {
            throw AppException.forbidden("Bạn không có quyền thanh toán tin này");
        }

        if (post.getStatus() != PostStatus.DRAFT) {
            throw AppException.badRequest("Tin này đã được thanh toán hoặc không còn ở trạng thái nháp");
        }

        User user = getUserForPayment(userId);

        BigDecimal baseFee = getPostingPrice(post, request.getDurationDays());
        PaymentCost cost = calculatePaymentCost(user, baseFee);

        ensureEnoughBalance(user, cost.finalFee(), "PAYMENT_POST_FAILED", post);

        BigDecimal openingBalance = user.getAccountBalance();
        BigDecimal closingBalance = openingBalance.subtract(cost.finalFee());

        user.setAccountBalance(closingBalance);
        // user.setTotalSpent(nullSafe(user.getTotalSpent()).add(cost.finalFee())); Bỏ vì tin còn có thể bị reject, không chắc chắn sẽ phát sinh chi phí

        post.setStatus(PostStatus.PENDING);
        post.setDurationDays(request.getDurationDays());
        post.setEndAt(null);
        post.setPushTime(null);

        Payment payment = createPayment(
                user,
                post,
                Payment.PaymentType.POST_PAYMENT,
                request.getDurationDays(),
                null,
                baseFee,
                cost.tax(),
                cost.discountPercent(),
                cost.finalFee(),
                openingBalance,
                closingBalance,
                now
        );

        notificationService.notifyUser(
                user.getId(),
                Notification.NotificationType.POST_INFORMATION,
                "Thanh toán đăng tin thành công. Tin \"" + post.getTitle()
                        + "\" đã được chuyển sang trạng thái chờ duyệt. "
                        + "Thời hạn hiển thị " + request.getDurationDays()
                        + " ngày sẽ bắt đầu tính sau khi tin được moderator duyệt. "
                        + "Phí đã thanh toán: " + cost.finalFee() + "đ."
        );

        auditLogService.log(
                user.getId(),
                "PAYMENT_POST_SUCCESS",
                AuditLog.TargetType.TRANSACTION,
                payment.getId(),
                "Người dùng #" + user.getId()
                        + " thanh toán đăng tin #" + post.getId()
                        + ". Tin chuyển từ DRAFT sang PENDING. "
                        + "Số ngày mua: " + request.getDurationDays()
                        + ". Phí gốc: " + baseFee
                        + "đ. Giảm giá: " + cost.discountPercent()
                        + "%. VAT: " + cost.tax()
                        + "đ. Phí thanh toán: " + cost.finalFee()
                        + "đ. Số dư trước: " + openingBalance
                        + "đ. Số dư sau: " + closingBalance + "đ."
        );

        return mapResponse(payment, post);
    }

    @Override
    @Transactional
    public PaymentResponse renewPost(Integer userId, RenewPaymentRequest request) {
        LocalDateTime now = LocalDateTime.now();

        Post post = getPostForPayment(request.getPostId());

        if (!post.getUser().getId().equals(userId)) {
            throw AppException.forbidden("Bạn không có quyền gia hạn tin này");
        }

        if (post.getStatus() != PostStatus.ACTIVE && post.getStatus() != PostStatus.EXPIRED) {
            throw AppException.badRequest("Chỉ có thể gia hạn tin đang hoạt động hoặc đã hết hạn");
        }

        User user = getUserForPayment(userId);

        BigDecimal baseFee = getPostingPrice(post, request.getDurationDays());
        PaymentCost cost = calculatePaymentCost(user, baseFee);

        ensureEnoughBalance(user, cost.finalFee(), "PAYMENT_POST_FAILED", post);

        BigDecimal openingBalance = user.getAccountBalance();
        BigDecimal closingBalance = openingBalance.subtract(cost.finalFee());

        user.setAccountBalance(closingBalance);
        user.setTotalSpent(nullSafe(user.getTotalSpent()).add(cost.finalFee()));
        membershipService.refreshUserMembership(user);

        LocalDateTime baseEndAt = post.getEndAt() != null && post.getEndAt().isAfter(now)
                ? post.getEndAt()
                : now;

        post.setEndAt(baseEndAt.plusDays(request.getDurationDays()));

        if (post.getStatus() == PostStatus.EXPIRED) {
            post.setStatus(PostStatus.ACTIVE);
        }

        Payment payment = createPayment(
                user,
                post,
                Payment.PaymentType.EXTEND,
                request.getDurationDays(),
                post.getEndAt(),
                baseFee,
                cost.tax(),
                cost.discountPercent(),
                cost.finalFee(),
                openingBalance,
                closingBalance,
                now
        );

        notificationService.notifyUser(
                user.getId(),
                Notification.NotificationType.POST_INFORMATION,
                "Gia hạn tin thành công. Tin \"" + post.getTitle()
                        + "\" đã được gia hạn thêm " + request.getDurationDays()
                        + " ngày. Ngày hết hạn mới: " + post.getEndAt()
                        + ". Phí đã thanh toán: " + cost.finalFee() + "đ."
        );

        auditLogService.log(
                user.getId(),
                "PAYMENT_RENEW_SUCCESS",
                AuditLog.TargetType.TRANSACTION,
                payment.getId(),
                "Người dùng #" + user.getId()
                        + " gia hạn tin #" + post.getId()
                        + ". Số ngày gia hạn: " + request.getDurationDays()
                        + ". Ngày hết hạn mới: " + post.getEndAt()
                        + ". Phí gốc: " + baseFee
                        + "đ. Giảm giá: " + cost.discountPercent()
                        + "%. VAT: " + cost.tax()
                        + "đ. Phí thanh toán: " + cost.finalFee()
                        + "đ. Số dư trước: " + openingBalance
                        + "đ. Số dư sau: " + closingBalance + "đ."
        );

        return mapResponse(payment, post);
    }

    @Override
    @Transactional
    public PaymentResponse boostPost(Integer userId, BoostPaymentRequest request) {
        LocalDateTime now = LocalDateTime.now();

        Post post = getPostForPayment(request.getPostId());

        if (!post.getUser().getId().equals(userId)) {
            throw AppException.forbidden("Bạn không có quyền đẩy tin này");
        }

        if (post.getStatus() != PostStatus.ACTIVE) {
            throw AppException.badRequest("Chỉ có thể đẩy tin đang hoạt động");
        }

        User user = getUserForPayment(userId);

        BigDecimal baseFee = post.getPostType().getPushPrice();

        if (baseFee == null || baseFee.compareTo(BigDecimal.ZERO) <= 0) {
            throw AppException.badRequest("Loại tin này chưa cấu hình phí đẩy tin");
        }

        PaymentCost cost = calculatePaymentCost(user, baseFee);

        ensureEnoughBalance(user, cost.finalFee(), "PAYMENT_POST_FAILED", post);

        BigDecimal openingBalance = user.getAccountBalance();
        BigDecimal closingBalance = openingBalance.subtract(cost.finalFee());

        user.setAccountBalance(closingBalance);
        user.setTotalSpent(nullSafe(user.getTotalSpent()).add(cost.finalFee()));
        membershipService.refreshUserMembership(user);

        post.setPushTime(now); // Cập nhật thời gian đẩy tin lên thời điểm hiện tại

        Payment payment = createPayment(
                user,
                post,
                Payment.PaymentType.PUSH,
                null,
                post.getEndAt(),
                baseFee,
                cost.tax(),
                cost.discountPercent(),
                cost.finalFee(),
                openingBalance,
                closingBalance,
                now
        );

        notificationService.notifyUser(
                user.getId(),
                Notification.NotificationType.POST_INFORMATION,
                "Đẩy tin thành công. Tin \"" + post.getTitle()
                        + "\" đã được cập nhật thời gian đẩy tin lúc " + post.getPushTime()
                        + ". Phí đã thanh toán: " + cost.finalFee() + "đ."
        );

        auditLogService.log(
                user.getId(),
                "PAYMENT_PUSH_SUCCESS",
                AuditLog.TargetType.TRANSACTION,
                payment.getId(),
                "Người dùng #" + user.getId()
                        + " đẩy tin #" + post.getId()
                        + ". Thời gian đẩy tin mới: " + post.getPushTime()
                        + ". Phí gốc: " + baseFee
                        + "đ. Giảm giá: " + cost.discountPercent()
                        + "%. VAT: " + cost.tax()
                        + "đ. Phí thanh toán: " + cost.finalFee()
                        + "đ. Số dư trước: " + openingBalance
                        + "đ. Số dư sau: " + closingBalance + "đ."
        );

        return mapResponse(payment, post);
    }

    private Post getPostForPayment(Integer postId) {
        return postRepository.findByIdForPayment(postId)
                .orElseThrow(() -> AppException.notFound("Không tìm thấy tin đăng"));
    }

    private User getUserForPayment(Integer userId) {
        return userRepository.findByIdForPayment(userId)
                .orElseThrow(() -> AppException.notFound("Không tìm thấy người dùng"));
    }

    private BigDecimal getPostingPrice(Post post, Integer durationDays) {
        PostTypePriceId priceId = new PostTypePriceId(post.getPostType().getId(), durationDays);

        PostTypePrice price = postTypePriceRepository.findById(priceId)
                .orElseThrow(() -> AppException.badRequest("Chưa cấu hình giá cho loại tin và số ngày này"));

        if (price.getPrice() == null || price.getPrice().compareTo(BigDecimal.ZERO) <= 0) {
            throw AppException.badRequest("Giá đăng tin không hợp lệ");
        }

        return price.getPrice();
    }

    private PaymentCost calculatePaymentCost(User user, BigDecimal baseFee) {
        int discountPercent = 0;

        MembershipLevel membershipLevel = user.getMembershipLevel();

        if (membershipLevel != null && membershipLevel.getDiscountPercent() != null) {
            discountPercent = membershipLevel.getDiscountPercent();
        }

        BigDecimal discountAmount = baseFee
                .multiply(BigDecimal.valueOf(discountPercent))
                .divide(BigDecimal.valueOf(100));

        BigDecimal subtotal = baseFee.subtract(discountAmount);
        BigDecimal tax = subtotal
                .multiply(VAT_RATE_PERCENT)
                .divide(BigDecimal.valueOf(100));
        BigDecimal finalFee = subtotal.add(tax);

        return new PaymentCost(discountPercent, tax, finalFee);
    }

    private void ensureEnoughBalance(User user, BigDecimal finalFee, String action, Post post) {
        BigDecimal balance = nullSafe(user.getAccountBalance());

        if (balance.compareTo(finalFee) < 0) {
            auditLogService.log(
                    user.getId(),
                    action,
                    AuditLog.TargetType.POST,
                    post.getId(),
                    "Thanh toán thất bại cho tin #" + post.getId()
                            + ". Lý do: số dư ví không đủ. "
                            + "Số dư hiện tại: " + balance
                            + "đ. Phí cần thanh toán: " + finalFee + "đ."
            );

            throw AppException.badRequest("Số dư ví không đủ");
        }
    }

    private Payment createPayment(
            User user,
            Post post,
            Payment.PaymentType paymentType,
            Integer days,
            LocalDateTime endAt,
            BigDecimal baseFee,
            BigDecimal tax,
            Integer discountPercent,
            BigDecimal finalFee,
            BigDecimal openingBalance,
            BigDecimal closingBalance,
            LocalDateTime now
    ) {
        Payment payment = new Payment();
        payment.setUser(user);
        payment.setPost(post);
        payment.setPaymentType(paymentType);
        payment.setDays(days);
        payment.setDayEnd(endAt != null ? endAt.toLocalDate() : null);
        payment.setBaseFee(baseFee);
        payment.setTax(tax);
        payment.setDiscountPercent(discountPercent);
        payment.setFinalFee(finalFee);
        payment.setOpeningBalance(openingBalance);
        payment.setClosingBalance(closingBalance);
        payment.setCreatedAt(now);

        return paymentRepository.save(payment);
    }

    private PaymentResponse mapResponse(Payment payment, Post post) {
        return PaymentResponse.builder()
                .paymentId(payment.getId())
                .postId(post.getId())
                .paymentType(payment.getPaymentType().name())
                .durationDays(payment.getDays())
                .baseFee(payment.getBaseFee())
                .tax(payment.getTax())
                .discountPercent(payment.getDiscountPercent())
                .finalFee(payment.getFinalFee())
                .openingBalance(payment.getOpeningBalance())
                .closingBalance(payment.getClosingBalance())
                .postEndAt(post.getEndAt())
                .pushTime(post.getPushTime())
                .createdAt(payment.getCreatedAt())
                .build();
    }

    private BigDecimal nullSafe(BigDecimal value) {
        return value != null ? value : BigDecimal.ZERO;
    }

    private record PaymentCost(Integer discountPercent, BigDecimal tax, BigDecimal finalFee) {
    }
}