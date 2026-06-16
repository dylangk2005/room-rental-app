USE phongtro_db;

INSERT INTO provinces (id, name, updated_at) VALUES
(1, 'TP. Hồ Chí Minh', NOW());

INSERT INTO districts (id, province_id, name, updated_at) VALUES
(1, 1, 'Quận 1', NOW()),
(2, 1, 'Quận 3', NOW()),
(3, 1, 'Quận 4', NOW()),
(4, 1, 'Quận 5', NOW()),
(5, 1, 'Quận 6', NOW()),
(6, 1, 'Quận 7', NOW()),
(7, 1, 'Quận 8', NOW()),
(8, 1, 'Quận 10', NOW()),
(9, 1, 'Quận 11', NOW()),
(10, 1, 'Quận 12', NOW()),
(11, 1, 'Bình Tân', NOW()),
(12, 1, 'Bình Thạnh', NOW()),
(13, 1, 'Gò Vấp', NOW()),
(14, 1, 'Phú Nhuận', NOW()),
(15, 1, 'Tân Bình', NOW()),
(16, 1, 'Tân Phú', NOW()),
(17, 1, 'TP. Thủ Đức', NOW()),
(18, 1, 'Bình Chánh', NOW()),
(19, 1, 'Cần Giờ', NOW()),
(20, 1, 'Củ Chi', NOW()),
(21, 1, 'Hóc Môn', NOW()),
(22, 1, 'Nhà Bè', NOW());

SET @seed_password = '$2a$10$L6IJcqTcbfRP/eXRUj9MmeNKpcLjlxyaU.qqy2WwwnIeIuKTNbiEe';

INSERT INTO roles (role_id, name, description) VALUES
(1, 'ADMIN', 'Quản trị viên hệ thống, toàn quyền thao tác'),
(2, 'MANAGER', 'Quản lý nội dung, giá dịch vụ và thống kê'),
(3, 'MODERATOR', 'Kiểm duyệt bài đăng và xử lý báo cáo'),
(4, 'USER', 'Người dùng thông thường');

INSERT INTO membership_levels (id, name, min_spent, discount_percent, updated_at) VALUES
(1, '', 0, 0, NOW()),
(2, 'Dong', 500000, 5, NOW()),
(3, 'Bac', 2000000, 10, NOW()),
(4, 'Vang', 7000000, 15, NOW()),
(5, 'Kim cuong', 15000000, 25, NOW());

INSERT INTO users
(id, full_name, email, password, phone_number, avatar, status, account_balance, total_spent, created_at, role_id, membership_level_id, must_change_password)
VALUES
(1, 'Nguyễn Văn Quản Trị', 'admin@phongtro.vn', @seed_password, '0901111111', 'https://picsum.photos/seed/admin/240/240', 'ACTIVE', 50000000, 0, '2024-01-01 08:00:00', 1, 1, FALSE),
(2, 'Trần Thị Quản Lý', 'manager@phongtro.vn', @seed_password, '0902222222', 'https://picsum.photos/seed/manager/240/240', 'ACTIVE', 10000000, 0, '2024-01-02 09:00:00', 2, 1, FALSE),
(3, 'Lê Văn Kiểm Duyệt', 'mod@phongtro.vn', @seed_password, '0903333333', 'https://picsum.photos/seed/mod/240/240', 'ACTIVE', 5000000, 0, '2024-01-03 10:00:00', 3, 1, FALSE),
(4, 'Pham Thi Hoa', 'hoa.pham@gmail.com', @seed_password, '0904444444', 'https://picsum.photos/seed/hoa/240/240', 'ACTIVE', 2500000, 7200000, '2024-02-10 11:00:00', 4, 4, FALSE),
(5, 'Nguyen Minh Tuan', 'tuan.nguyen@gmail.com', @seed_password, '0905555555', NULL, 'ACTIVE', 800000, 1500000, '2024-03-05 08:30:00', 4, 2, FALSE),
(6, 'Tran Thi Lan', 'lan.tran@gmail.com', @seed_password, '0906666666', 'https://picsum.photos/seed/lan/240/240', 'ACTIVE', 3200000, 25000000, '2024-01-20 14:00:00', 4, 5, FALSE),
(7, 'Vo Van Binh', 'binh.vo@gmail.com', @seed_password, '0907777777', NULL, 'ACTIVE', 500000, 300000, '2024-04-01 09:00:00', 4, 1, FALSE),
(8, 'Do Thi Mai', 'mai.do@gmail.com', @seed_password, '0908888888', 'https://picsum.photos/seed/mai/240/240', 'BANNED', 0, 900000, '2024-02-15 16:00:00', 4, 2, FALSE),
(9, 'Hoang Van Duc', 'duc.hoang@gmail.com', @seed_password, '0909999999', NULL, 'ACTIVE', 1200000, 4500000, '2024-03-20 07:00:00', 4, 3, FALSE),
(10, 'Bui Thi Thuy', 'thuy.bui@gmail.com', @seed_password, '0910000000', 'https://picsum.photos/seed/thuy/240/240', 'ACTIVE', 650000, 600000, '2024-04-10 10:30:00', 4, 2, FALSE);

INSERT INTO user_penalties (id, type, reason, start_date, end_date, created_at, user_id) VALUES
(1, 'WARNING', 'Đăng tin với thông tin giá thuê không chính xác', '2024-05-01 09:00:00', NULL, '2024-05-01 09:00:00', 7),
(2, 'LOCK_POST', 'Đăng tin trùng lặp nhiều lần trong ngày', '2024-05-10 10:00:00', '2024-05-17 10:00:00', '2024-05-10 10:00:00', 9),
(3, 'BAN_ACCOUNT', 'Lừa đảo người thuê, nhận tiền cọc rồi bỏ trốn', '2024-06-01 08:00:00', NULL, '2024-06-01 08:00:00', 8);

INSERT INTO deposits
(id, amount, tax, net_amount, method, status, transaction_ref, gateway_transaction_no, opening_balance, closing_balance, note, created_at, user_id)
VALUES
(1, 1000000, 0, 1000000, 'BANK_TRANSFER', 'SUCCESS', 'BT-20240210-0001', 'MB-GD001', 0, 1000000, 'Nap lan dau qua MB Bank', '2024-02-10 11:30:00', 4),
(2, 2000000, 0, 2000000, 'VNPAY', 'SUCCESS', 'VNPAY-20240312-0002', 'GD-20240312-004', 1000000, 3000000, 'Nap qua VNPAY', '2024-03-12 14:00:00', 4),
(3, 500000, 0, 500000, 'BANK_TRANSFER', 'SUCCESS', 'BT-20240306-0003', 'VCB-GD002', 0, 500000, 'Nap qua Vietcombank', '2024-03-06 09:00:00', 5),
(4, 1000000, 0, 1000000, 'VNPAY', 'SUCCESS', 'VNPAY-20240320-0004', 'GD-20240320-005', 500000, 1500000, 'Nap qua VNPAY', '2024-03-20 15:30:00', 5),
(5, 5000000, 0, 5000000, 'BANK_TRANSFER', 'SUCCESS', 'BT-20240125-0005', 'TCB-GD010', 0, 5000000, 'Nạp ví đăng tin', '2024-01-25 08:00:00', 6),
(6, 10000000, 0, 10000000, 'BANK_TRANSFER', 'SUCCESS', 'BT-20240201-0006', 'TCB-GD020', 5000000, 15000000, 'Nap them vi', '2024-02-01 09:00:00', 6),
(7, 500000, 0, 500000, 'VNPAY', 'SUCCESS', 'VNPAY-20240402-0007', 'GD-20240402-007', 0, 500000, 'Nap qua VNPAY', '2024-04-02 10:00:00', 7),
(8, 200000, 0, 200000, 'BANK_TRANSFER', 'FAILED', 'BT-20240415-0008', NULL, 500000, 500000, 'Sai thông tin tài khoản', '2024-04-15 11:00:00', 7),
(9, 1000000, 0, 1000000, 'BANK_TRANSFER', 'SUCCESS', 'BT-20240321-0009', 'ACB-GD030', 0, 1000000, 'Nap qua ACB', '2024-03-21 07:30:00', 9),
(10, 300000, 0, 300000, 'VNPAY', 'PENDING', 'VNPAY-20240411-0010', NULL, 650000, 650000, 'Cho xac nhan tu cong VNPAY', '2024-04-11 10:45:00', 10);

INSERT INTO post_types (id, name, title_color, title_size, priority, push_price, is_uppercase, has_recommend_tag, max_image_limit, updated_at) VALUES
(1, 'Tin thường', '#111827', 14, 4, 2000, FALSE, FALSE, 1, NOW()),
(2, 'Tin VIP2', '#0F766E', 15, 3, 2000, FALSE, FALSE, 2, NOW()),
(3, 'Tin VIP1', '#DB2777', 16, 2, 3000, FALSE, FALSE, 3, NOW()),
(4, 'Tin Vip Nổi Bật', '#DC2626', 18, 1, 5000, TRUE, TRUE, 5, NOW());

INSERT INTO post_type_prices (post_type_id, day, price) VALUES
(1, 5, 12000),
(1, 10, 24000),
(1, 15, 36000),
(1, 30, 70000),
(2, 5, 50000),
(2, 10, 100000),
(2, 15, 130000),
(2, 30, 250000),
(3, 5, 100000),
(3, 10, 200000),
(3, 15, 280000),
(3, 30, 550000),
(4, 5, 180000),
(4, 10, 360000),
(4, 15, 500000),
(4, 30, 900000);

INSERT INTO posts
(id, title, description, address, province_id, district_id, area, rental_price, status, created_at, updated_at, push_time, end_at, user_id, post_type_id, duration_days)
VALUES
(1, 'Phòng trọ gần ĐH Công nghiệp, có gác lửng, WC riêng', 'Phòng thoáng mát, có cửa sổ lớn, gác lửng tiện để đồ. WC riêng, máy nước nóng. Gần siêu thị và trường học.', '15/3 Nguyễn Văn Bảo', 1, 13, 22.5, 2500000, 'ACTIVE', '2026-06-01 09:00:00', '2026-06-01 09:00:00', '2026-06-01 10:00:00', '2026-07-01 10:00:00', 4, 1, 30),
(2, 'Phòng VIP full nội thất, ban công view đẹp, Bình Thạnh', 'Phòng cao cấp đầy đủ nội thất: giường, tủ, bàn làm việc, điều hòa, máy giặt riêng. An ninh 24/7, thang máy.', '45 Xô Viết Nghệ Tĩnh', 1, 12, 30.0, 5500000, 'ACTIVE', '2026-06-02 10:00:00', '2026-06-02 10:00:00', '2026-06-02 11:00:00', '2026-07-02 11:00:00', 4, 2, 30),
(3, 'Nhà nguyên căn 3PN cho thuê, hẻm xe hơi, Quận 12', 'Nhà 1 trệt 1 lầu, 3 phòng ngủ, 2 WC, bếp rộng, sân để xe. Phù hợp gia đình hoặc nhóm 4-5 người.', '22 Đường số 8, KDC Tân Thới Nhất', 1, 10, 80.0, 9000000, 'ACTIVE', '2026-06-03 14:00:00', '2026-06-03 14:00:00', '2026-06-03 15:00:00', '2026-07-03 15:00:00', 6, 3, 30),
(4, 'Phòng sinh viên giá rẻ, gần HUTECH, có chỗ để xe', 'Phòng nhỏ gọn, phù hợp 1-2 sinh viên. Có wifi, chỗ để xe máy. Ra đường lớn 5 phút đi bộ.', '7/1 Đường Phan Văn Trị', 1, 12, 16.0, 1800000, 'EXPIRED', '2026-05-01 08:00:00', '2026-06-10 08:00:00', '2026-05-01 09:00:00', '2026-06-01 09:00:00', 5, 1, 30),
(5, 'Phòng trọ cao cấp khu dân cư Lovera, Bình Chánh', 'Phòng mới xây, nội thất cao cấp, máy lạnh, nóng lạnh. Khu dân cư có bảo vệ, gần KCN Vĩnh Lộc.', '12 Lovera Vista', 1, 18, 25.0, 3800000, 'ACTIVE', '2026-06-04 11:00:00', '2026-06-04 11:00:00', '2026-06-04 12:00:00', '2026-07-04 12:00:00', 6, 2, 30),
(6, 'Phòng trọ bị từ chối vì ảnh không đúng thực tế', 'Nội dung mô tả không khớp thực tế và địa chỉ không xác minh được.', '99 Đường Giả', 1, 1, 18.0, 2000000, 'REJECTED', '2026-06-05 10:00:00', '2026-06-05 16:00:00', NULL, NULL, 8, 1, 30),
(7, 'Phòng trọ hẻm yên tĩnh, gần chợ Thủ Đức', 'Phòng yên tĩnh, thoáng mát, hẻm sạch sẽ. Gần chợ, trường học, bệnh viện. Cho phép nấu ăn.', '88 Kha Vạn Cân', 1, 17, 20.0, 2200000, 'EXPIRED', '2026-04-25 09:00:00', '2026-05-25 10:00:00', '2026-04-25 10:00:00', '2026-05-25 10:00:00', 9, 1, 30),
(8, 'Căn hộ mini full nội thất Q.7, sầm uất, dễ di chuyển', 'Căn hộ mini 1 phòng ngủ riêng biệt, full nội thất cao cấp. Khu vực sầm uất gần Phú Mỹ Hưng.', '30/4 Nguyễn Thị Thập', 1, 6, 28.0, 6000000, 'ACTIVE', '2026-06-06 10:00:00', '2026-06-06 10:00:00', '2026-06-06 11:00:00', '2026-07-06 11:00:00', 6, 3, 30),
(9, 'Phòng trọ bình dân, sạch sẽ, Hóc Môn', 'Phòng đơn giản, sạch, có quạt trần và cửa sổ. Chủ nhà thân thiện.', '5 Đường Bà Điểm 5', 1, 21, 14.0, 1200000, 'ACTIVE', '2026-06-07 07:00:00', '2026-06-07 07:00:00', '2026-06-07 08:00:00', '2026-07-07 08:00:00', 10, 1, 30),
(10, 'Phòng trọ đã hết hạn tại Quận 3', 'Tin đã hết hạn, giữ lại trong dữ liệu mẫu để kiểm tra luồng gia hạn và thống kê.', '10 Cách Mạng Tháng 8', 1, 2, 18.0, 3000000, 'EXPIRED', '2026-05-05 09:00:00', '2026-06-05 10:00:00', '2026-05-05 10:00:00', '2026-06-05 10:00:00', 5, 1, 30);

INSERT INTO post_images (id, image_url, updated_at, post_id) VALUES
(1, 'https://picsum.photos/seed/post-1-main/900/600', NOW(), 1),
(2, 'https://picsum.photos/seed/post-1-room/900/600', NOW(), 1),
(3, 'https://picsum.photos/seed/post-2-main/900/600', NOW(), 2),
(4, 'https://picsum.photos/seed/post-2-balcony/900/600', NOW(), 2),
(5, 'https://picsum.photos/seed/post-3-front/900/600', NOW(), 3),
(6, 'https://picsum.photos/seed/post-3-kitchen/900/600', NOW(), 3),
(7, 'https://picsum.photos/seed/post-4-main/900/600', NOW(), 4),
(8, 'https://picsum.photos/seed/post-5-main/900/600', NOW(), 5),
(9, 'https://picsum.photos/seed/post-8-main/900/600', NOW(), 8),
(10, 'https://picsum.photos/seed/post-9-main/900/600', NOW(), 9),
(11, 'https://picsum.photos/seed/post-10-main/900/600', NOW(), 10);

INSERT INTO payments
(id, payment_type, days, day_end, base_fee, tax, discount_percent, final_fee, opening_balance, closing_balance, created_at, user_id, post_id)
VALUES
(1, 'POST_PAYMENT', 30, '2026-07-01', 100000, 0, 10, 90000, 1000000, 910000, '2026-06-01 09:05:00', 4, 1),
(2, 'POST_PAYMENT', 30, '2026-07-02', 300000, 0, 10, 270000, 2910000, 2640000, '2026-06-02 10:05:00', 4, 2),
(3, 'POST_PAYMENT', 30, '2026-07-03', 600000, 0, 15, 510000, 5000000, 4490000, '2026-06-03 14:05:00', 6, 3),
(4, 'POST_PAYMENT', 30, '2026-06-01', 100000, 0, 5, 95000, 500000, 405000, '2026-05-01 08:05:00', 5, 4),
(5, 'POST_PAYMENT', 30, '2026-07-04', 300000, 0, 15, 255000, 4490000, 4235000, '2026-06-04 11:05:00', 6, 5),
(6, 'POST_PAYMENT', 30, '2026-07-05', 100000, 0, 0, 100000, 900000, 800000, '2026-06-05 10:05:00', 8, 6),
(7, 'REFUND', 30, '2026-07-05', 100000, 0, 0, 100000, 800000, 900000, '2026-06-05 16:30:00', 8, 6),
(8, 'POST_PAYMENT', 30, '2026-05-25', 100000, 0, 5, 95000, 1000000, 905000, '2026-04-25 09:05:00', 9, 7),
(9, 'EXTEND', 30, '2026-05-25', 100000, 0, 5, 95000, 905000, 810000, '2026-05-01 09:05:00', 9, 7),
(10, 'POST_PAYMENT', 30, '2026-07-06', 600000, 0, 15, 510000, 4235000, 3725000, '2026-06-06 10:05:00', 6, 8),
(11, 'POST_PAYMENT', 30, '2026-07-07', 100000, 0, 0, 100000, 300000, 200000, '2026-06-07 07:05:00', 10, 9),
(12, 'POST_PAYMENT', 30, '2026-06-05', 100000, 0, 5, 95000, 1466750, 1371750, '2026-05-05 09:05:00', 5, 10),
(13, 'PUSH', NULL, NULL, 30000, 0, 10, 27000, 2640000, 2613000, '2026-06-10 09:05:00', 4, 2);

INSERT INTO favorites (user_id, post_id, created_at) VALUES
(5, 1, '2024-04-02 08:00:00'),
(5, 2, '2024-04-06 09:00:00'),
(7, 2, '2024-04-07 10:00:00'),
(7, 3, '2024-04-07 10:05:00'),
(9, 2, '2024-04-08 07:00:00'),
(9, 8, '2024-04-09 07:30:00'),
(10, 1, '2024-04-13 11:00:00'),
(10, 10, '2026-06-06 11:05:00');

INSERT INTO reports
(id, reason, description, status, created_at, resolved_at, resolution_note, user_id, post_id, moderator_id)
VALUES
(1, 'Ảnh đăng không phải ảnh thật của phòng', 'Người báo cáo cho biết địa chỉ và ảnh không khớp thực tế.', 'RESOLVED', '2024-03-01 15:00:00', '2024-03-01 16:00:00', 'Đã xác minh và từ chối bài đăng.', 5, 6, 3),
(2, 'Chủ phòng không liên lạc được', 'Số điện thoại sai hoặc không nghe máy nhiều ngày.', 'PENDING', '2024-04-11 09:00:00', NULL, NULL, 7, 9, NULL),
(3, 'Giá đăng không đúng thực tế', 'Người xem liên hệ thì được báo giá khác với bài đăng.', 'REJECTED', '2024-04-02 11:00:00', '2024-04-02 14:00:00', 'Chưa đủ bằng chứng để xử lý.', 10, 1, 3),
(4, 'Nội dung lừa đảo', 'Bài đăng yêu cầu cọc trước và dùng địa chỉ không tồn tại.', 'RESOLVED', '2026-06-05 08:30:00', '2026-06-05 09:00:00', 'Đã xác minh và từ chối bài đăng.', 4, 6, 3);

INSERT INTO report_images (id, image_url, updated_at, report_id) VALUES
(1, 'https://picsum.photos/seed/report-1/900/600', NOW(), 1),
(2, 'https://picsum.photos/seed/report-2/900/600', NOW(), 2),
(3, 'https://picsum.photos/seed/report-4/900/600', NOW(), 4);

INSERT INTO moderation_logs (id, action, target_type, target_id, reason, created_at, user_id) VALUES
(1, 'ACCEPT_POST', 'POST', 1, 'Bài đăng hợp lệ, duyệt thành công', '2024-04-01 10:00:00', 3),
(2, 'ACCEPT_POST', 'POST', 2, 'Bài VIP hợp lệ, duyệt thành công', '2024-04-05 11:00:00', 3),
(3, 'ACCEPT_POST', 'POST', 3, 'Bài nổi bật hợp lệ', '2024-03-20 15:00:00', 3),
(4, 'REJECT_POST', 'POST', 6, 'Nội dung vi phạm: ảnh giả, địa chỉ không đúng', '2024-03-01 16:00:00', 3),
(5, 'ACCEPT_REPORT', 'REPORT', 1, 'Báo cáo có căn cứ', '2024-03-01 16:00:00', 3),
(6, 'WARNING', 'USER', 7, 'Đăng tin sai lệch thông tin lần 1', '2024-05-01 09:30:00', 3),
(7, 'LOCK_POST', 'USER', 9, 'Đăng tin trùng lặp nhiều lần', '2024-05-10 10:00:00', 3),
(8, 'BAN_ACCOUNT', 'USER', 8, 'Lừa đảo tiền cọc, nhiều người báo cáo', '2024-06-01 08:30:00', 3),
(9, 'REJECT_POST', 'POST', 6, 'Bài đăng vi phạm nghiêm trọng', '2026-06-05 09:00:00', 3);

INSERT INTO audit_logs (id, action, target_type, target_id, reason, created_at, user_id) VALUES
(1, 'APPROVE', 'POST', 1, 'Bài đăng hợp lệ, duyệt thành công', '2024-04-01 10:00:00', 3),
(2, 'APPROVE', 'POST', 2, 'Bài VIP hợp lệ, duyệt thành công', '2024-04-05 11:00:00', 3),
(3, 'APPROVE', 'POST', 3, 'Bài nổi bật hợp lệ', '2024-03-20 15:00:00', 3),
(4, 'REJECT', 'POST', 6, 'Nội dung vi phạm: ảnh giả, địa chỉ không đúng', '2024-03-01 16:00:00', 2),
(5, 'REFUND', 'TRANSACTION', 7, 'Hoàn tiền do bài đăng bị từ chối', '2024-03-02 08:30:00', 2),
(6, 'BAN', 'USER', 8, 'Lừa đảo tiền cọc, nhiều người báo cáo', '2024-06-01 08:30:00', 1),
(7, 'CREATE', 'MEMBERSHIP', 3, 'Hạng Vàng cập nhật ưu đãi 10%', '2024-01-01 07:00:00', 1),
(8, 'UPDATE', 'POST', 10, 'Chủ tin tự ẩn bài để sửa chữa', '2024-04-14 08:05:00', 5),
(9, 'SYSTEM_BACKUP', 'SYSTEM', NULL, 'Ban ghi mau cho audit log he thong', '2024-04-20 02:00:00', 1);

INSERT INTO notifications (id, title, message, is_read, created_at, user_id) VALUES
(1, 'POST_INFORMATION', 'Bài đăng "Phòng trọ gần ĐH Công nghiệp" đã được duyệt và hiển thị.', TRUE, '2024-04-01 10:05:00', 4),
(2, 'POST_INFORMATION', 'Bài đăng VIP "Phòng full nội thất, ban công view đẹp" đã được duyệt.', TRUE, '2024-04-05 11:05:00', 4),
(3, 'POST_INFORMATION', 'Bài đăng Nổi bật "Nhà nguyên căn 3PN" đã được duyệt.', TRUE, '2024-03-20 15:05:00', 6),
(4, 'POST_INFORMATION', 'Bài đăng của bạn đã bị từ chối: ảnh giả, địa chỉ không chính xác.', TRUE, '2024-03-01 16:05:00', 8),
(5, 'POST_INFORMATION', 'Bạn đã được hoàn 100.000đ vào ví do bài đăng bị từ chối.', TRUE, '2024-03-02 08:35:00', 8),
(6, 'POST_EXPIRING', 'Bài đăng "Phòng trọ gần ĐH Công nghiệp" sẽ hết hạn sau 3 ngày.', FALSE, '2024-04-28 08:00:00', 4),
(7, 'POST_EXPIRING', 'Bài đăng "Phòng trọ hẻm yên tĩnh, gần chợ Thủ Đức" đã hết hạn.', FALSE, '2024-03-01 09:05:00', 9),
(8, 'POST_INFORMATION', 'Bài đăng "Căn hộ mini full nội thất Q.7" đã được duyệt thành công.', FALSE, '2024-04-08 11:05:00', 6),
(9, 'SYSTEM_INFORMATION', 'Chào mừng bạn đến với TAYTRO. Hãy nạp tiền để bắt đầu đăng tin.', TRUE, '2024-04-10 08:01:00', 5),
(10, 'SYSTEM_INFORMATION', 'Hệ thống sẽ bảo trì từ 02:00-04:00 ngày 20/04/2024.', TRUE, '2024-04-19 18:00:00', 4),
(11, 'SYSTEM_INFORMATION', 'Hệ thống sẽ bảo trì từ 02:00-04:00 ngày 20/04/2024.', FALSE, '2024-04-19 18:00:00', 5),
(12, 'REPORT_INFORMATION', 'Báo cáo của bạn đã được tiếp nhận và đang chờ xử lý.', FALSE, '2024-04-11 09:01:00', 7);
