USE phongtro_db;

SET @seed_password = '$2a$10$L6IJcqTcbfRP/eXRUj9MmeNKpcLjlxyaU.qqy2WwwnIeIuKTNbiEe';

INSERT INTO roles (role_id, name, description) VALUES
(1, 'ADMIN', 'Quan tri vien he thong, toan quyen thao tac'),
(2, 'MANAGER', 'Quan ly noi dung, gia dich vu va thong ke'),
(3, 'MODERATOR', 'Kiem duyet bai dang va xu ly bao cao'),
(4, 'USER', 'Nguoi dung thong thuong');

INSERT INTO membership_levels (id, name, min_spent, discount_percent, updated_at) VALUES
(1, 'Dong', 0, 0, NOW()),
(2, 'Bac', 1000000, 5, NOW()),
(3, 'Vang', 5000000, 10, NOW()),
(4, 'Kim cuong', 20000000, 15, NOW());

INSERT INTO users
(id, full_name, email, password, phone_number, avatar, status, account_balance, total_spent, created_at, role_id, membership_level_id, must_change_password)
VALUES
(1, 'Nguyen Van Admin', 'admin@phongtro.vn', @seed_password, '0901111111', 'https://picsum.photos/seed/admin/240/240', 'ACTIVE', 50000000, 0, '2024-01-01 08:00:00', 1, 1, FALSE),
(2, 'Tran Thi Manager', 'manager@phongtro.vn', @seed_password, '0902222222', 'https://picsum.photos/seed/manager/240/240', 'ACTIVE', 10000000, 0, '2024-01-02 09:00:00', 2, 1, FALSE),
(3, 'Le Van Moderator', 'mod@phongtro.vn', @seed_password, '0903333333', 'https://picsum.photos/seed/mod/240/240', 'ACTIVE', 5000000, 0, '2024-01-03 10:00:00', 3, 1, FALSE),
(4, 'Pham Thi Hoa', 'hoa.pham@gmail.com', @seed_password, '0904444444', 'https://picsum.photos/seed/hoa/240/240', 'ACTIVE', 2500000, 7200000, '2024-02-10 11:00:00', 4, 3, FALSE),
(5, 'Nguyen Minh Tuan', 'tuan.nguyen@gmail.com', @seed_password, '0905555555', NULL, 'ACTIVE', 800000, 1500000, '2024-03-05 08:30:00', 4, 2, FALSE),
(6, 'Tran Thi Lan', 'lan.tran@gmail.com', @seed_password, '0906666666', 'https://picsum.photos/seed/lan/240/240', 'ACTIVE', 3200000, 25000000, '2024-01-20 14:00:00', 4, 4, FALSE),
(7, 'Vo Van Binh', 'binh.vo@gmail.com', @seed_password, '0907777777', NULL, 'ACTIVE', 500000, 300000, '2024-04-01 09:00:00', 4, 1, FALSE),
(8, 'Do Thi Mai', 'mai.do@gmail.com', @seed_password, '0908888888', 'https://picsum.photos/seed/mai/240/240', 'BANNED', 0, 900000, '2024-02-15 16:00:00', 4, 1, FALSE),
(9, 'Hoang Van Duc', 'duc.hoang@gmail.com', @seed_password, '0909999999', NULL, 'ACTIVE', 1200000, 4500000, '2024-03-20 07:00:00', 4, 2, FALSE),
(10, 'Bui Thi Thuy', 'thuy.bui@gmail.com', @seed_password, '0910000000', 'https://picsum.photos/seed/thuy/240/240', 'ACTIVE', 650000, 600000, '2024-04-10 10:30:00', 4, 1, FALSE);

INSERT INTO user_penalties (id, type, reason, start_date, end_date, created_at, user_id) VALUES
(1, 'WARNING', 'Dang tin voi thong tin gia thue khong chinh xac', '2024-05-01 09:00:00', NULL, '2024-05-01 09:00:00', 7),
(2, 'LOCK_POST', 'Dang tin trung lap nhieu lan trong ngay', '2024-05-10 10:00:00', '2024-05-17 10:00:00', '2024-05-10 10:00:00', 9),
(3, 'BAN_ACCOUNT', 'Lua dao nguoi thue, nhan tien coc roi bo tron', '2024-06-01 08:00:00', NULL, '2024-06-01 08:00:00', 8);

INSERT INTO deposits
(id, amount, tax, net_amount, method, status, transaction_ref, gateway_transaction_no, opening_balance, closing_balance, note, created_at, user_id)
VALUES
(1, 1000000, 0, 1000000, 'BANK_TRANSFER', 'SUCCESS', 'BT-20240210-0001', 'MB-GD001', 0, 1000000, 'Nap lan dau qua MB Bank', '2024-02-10 11:30:00', 4),
(2, 2000000, 0, 2000000, 'VNPAY', 'SUCCESS', 'VNPAY-20240312-0002', 'GD-20240312-004', 1000000, 3000000, 'Nap qua VNPAY', '2024-03-12 14:00:00', 4),
(3, 500000, 0, 500000, 'BANK_TRANSFER', 'SUCCESS', 'BT-20240306-0003', 'VCB-GD002', 0, 500000, 'Nap qua Vietcombank', '2024-03-06 09:00:00', 5),
(4, 1000000, 0, 1000000, 'VNPAY', 'SUCCESS', 'VNPAY-20240320-0004', 'GD-20240320-005', 500000, 1500000, 'Nap qua VNPAY', '2024-03-20 15:30:00', 5),
(5, 5000000, 0, 5000000, 'BANK_TRANSFER', 'SUCCESS', 'BT-20240125-0005', 'TCB-GD010', 0, 5000000, 'Nap vi dang tin', '2024-01-25 08:00:00', 6),
(6, 10000000, 0, 10000000, 'BANK_TRANSFER', 'SUCCESS', 'BT-20240201-0006', 'TCB-GD020', 5000000, 15000000, 'Nap them vi', '2024-02-01 09:00:00', 6),
(7, 500000, 0, 500000, 'VNPAY', 'SUCCESS', 'VNPAY-20240402-0007', 'GD-20240402-007', 0, 500000, 'Nap qua VNPAY', '2024-04-02 10:00:00', 7),
(8, 200000, 0, 200000, 'BANK_TRANSFER', 'FAILED', 'BT-20240415-0008', NULL, 500000, 500000, 'Sai thong tin tai khoan', '2024-04-15 11:00:00', 7),
(9, 1000000, 0, 1000000, 'BANK_TRANSFER', 'SUCCESS', 'BT-20240321-0009', 'ACB-GD030', 0, 1000000, 'Nap qua ACB', '2024-03-21 07:30:00', 9),
(10, 300000, 0, 300000, 'VNPAY', 'PENDING', 'VNPAY-20240411-0010', NULL, 650000, 650000, 'Cho xac nhan tu cong VNPAY', '2024-04-11 10:45:00', 10);

INSERT INTO post_types (id, name, title_color, title_size, priority, push_price, updated_at) VALUES
(1, 'Thuong', '#333333', 14, 3, 10000, NOW()),
(2, 'VIP', '#E65C00', 16, 2, 30000, NOW()),
(3, 'Noi bat', '#CC0000', 18, 1, 50000, NOW());

INSERT INTO post_type_prices (post_type_id, day, price) VALUES
(1, 7, 35000),
(1, 15, 60000),
(1, 30, 100000),
(2, 7, 100000),
(2, 15, 180000),
(2, 30, 300000),
(3, 7, 200000),
(3, 15, 360000),
(3, 30, 600000);

INSERT INTO posts
(id, title, description, address, province, district, area, rental_price, status, created_at, updated_at, push_time, end_at, user_id, post_type_id, duration_days)
VALUES
(1, 'Phong tro gan DH Cong nghiep, co gac lung, WC rieng', 'Phong thoang mat, co cua so lon, gac lung tien de do. WC rieng, may nuoc nong. Gan sieu thi va truong hoc.', '15/3 Nguyen Van Bao', 'TP. Ho Chi Minh', 'Go Vap', 22.5, 2500000, 'ACTIVE', '2024-04-01 09:00:00', '2024-04-01 09:00:00', '2024-04-01 10:00:00', '2024-05-01 10:00:00', 4, 1, 30),
(2, 'Phong VIP full noi that, ban cong view dep, Binh Thanh', 'Phong cao cap day du noi that: giuong, tu, ban lam viec, dieu hoa, may giat rieng. An ninh 24/7, thang may.', '45 Xo Viet Nghe Tinh', 'TP. Ho Chi Minh', 'Binh Thanh', 30.0, 5500000, 'ACTIVE', '2024-04-05 10:00:00', '2024-04-05 10:00:00', '2024-04-05 11:00:00', '2024-05-05 11:00:00', 4, 2, 30),
(3, 'Nha nguyen can 3PN cho thue, hem xe hoi, Quan 12', 'Nha 1 tret 1 lau, 3 phong ngu, 2 WC, bep rong, san de xe. Phu hop gia dinh hoac nhom 4-5 nguoi.', '22 Duong so 8, KDC Tan Thoi Nhat', 'TP. Ho Chi Minh', 'Quan 12', 80.0, 9000000, 'ACTIVE', '2024-03-20 14:00:00', '2024-03-20 14:00:00', '2024-03-20 15:00:00', '2024-04-19 15:00:00', 6, 3, 30),
(4, 'Phong sinh vien gia re, gan HUTECH, co cho de xe', 'Phong nho gon, phu hop 1-2 sinh vien. Co wifi, cho de xe may. Ra duong lon 5 phut di bo.', '7/1 Duong Phan Van Tri', 'TP. Ho Chi Minh', 'Binh Thanh', 16.0, 1800000, 'PENDING', '2024-04-10 08:00:00', '2024-04-10 08:00:00', NULL, NULL, 5, 1, 7),
(5, 'Phong tro cao cap khu dan cu Lovera, Binh Chanh', 'Phong moi xay, noi that cao cap, may lanh, nong lanh. Khu dan cu co bao ve, gan KCN Vinh Loc.', '12 Lovera Vista', 'TP. Ho Chi Minh', 'Binh Chanh', 25.0, 3800000, 'ACTIVE', '2024-03-15 11:00:00', '2024-03-15 11:00:00', '2024-03-15 12:00:00', '2024-04-14 12:00:00', 6, 2, 30),
(6, 'Phong tro bi tu choi vi anh khong dung thuc te', 'Noi dung mo ta khong khop thuc te va dia chi khong xac minh duoc.', '99 Duong Gia', 'TP. Ho Chi Minh', 'Quan 1', 18.0, 2000000, 'REJECTED', '2024-03-01 10:00:00', '2024-03-01 16:00:00', NULL, NULL, 8, 1, 30),
(7, 'Phong tro hem yen tinh, gan cho Thu Duc', 'Phong yen tinh, thoang mat, hem sach se. Gan cho, truong hoc, benh vien. Cho phep nau an.', '88 Kha Van Can', 'TP. Ho Chi Minh', 'TP. Thu Duc', 20.0, 2200000, 'EXPIRED', '2024-02-01 09:00:00', '2024-02-01 09:00:00', '2024-02-01 10:00:00', '2024-03-02 10:00:00', 9, 1, 30),
(8, 'Can ho mini full noi that Q.7, sam uat, de di chuyen', 'Can ho mini 1 phong ngu rieng biet, full noi that cao cap. Khu vuc sam uat gan Phu My Hung.', '30/4 Nguyen Thi Thap', 'TP. Ho Chi Minh', 'Quan 7', 28.0, 6000000, 'ACTIVE', '2024-04-08 10:00:00', '2024-04-08 10:00:00', '2024-04-08 11:00:00', '2024-05-08 11:00:00', 6, 3, 30),
(9, 'Phong tro binh dan, sach se, Hoc Mon', 'Phong don gian, sach, co quat tran va cua so. Chu nha than thien.', '5 Duong Ba Diem 5', 'TP. Ho Chi Minh', 'Hoc Mon', 14.0, 1200000, 'ACTIVE', '2024-04-12 07:00:00', '2024-04-12 07:00:00', '2024-04-12 08:00:00', '2024-05-12 08:00:00', 10, 1, 30),
(10, 'Phong tro dang an de sua chua', 'Dang sua chua, tam an khoi danh sach.', '10 Cach Mang Thang 8', 'TP. Ho Chi Minh', 'Quan 3', 18.0, 3000000, 'HIDDEN', '2024-04-03 09:00:00', '2024-04-14 08:00:00', '2024-04-03 10:00:00', '2024-05-03 10:00:00', 5, 1, 30),
(11, 'Tin nhap chua thanh toan', 'Bai dang dang o trang thai nhap de test luong thanh toan.', '18 Duong D1', 'TP. Ho Chi Minh', 'Binh Thanh', 21.0, 3200000, 'DRAFT', '2024-04-20 09:00:00', '2024-04-20 09:00:00', NULL, NULL, 5, 2, NULL),
(12, 'Tin da xoa do vi pham nghiem trong', 'Bai dang bi xoa sau khi xu ly bao cao.', '100 Duong Khong Ton Tai', 'TP. Ho Chi Minh', 'Quan 5', 12.0, 1000000, 'DELETED', '2024-03-05 09:00:00', '2024-03-06 09:00:00', NULL, NULL, 8, 1, 7);

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
(11, 'https://picsum.photos/seed/post-10-main/900/600', NOW(), 10),
(12, 'https://picsum.photos/seed/post-11-main/900/600', NOW(), 11);

INSERT INTO payments
(id, payment_type, days, day_end, base_fee, tax, discount_percent, final_fee, opening_balance, closing_balance, created_at, user_id, post_id)
VALUES
(1, 'POST_PAYMENT', 30, '2024-05-01', 100000, 0, 10, 90000, 1000000, 910000, '2024-04-01 09:05:00', 4, 1),
(2, 'POST_PAYMENT', 30, '2024-05-05', 300000, 0, 10, 270000, 2910000, 2640000, '2024-04-05 10:05:00', 4, 2),
(3, 'POST_PAYMENT', 30, '2024-04-19', 600000, 0, 15, 510000, 5000000, 4490000, '2024-03-20 14:05:00', 6, 3),
(4, 'POST_PAYMENT', 7, '2024-04-17', 35000, 0, 5, 33250, 500000, 466750, '2024-04-10 08:05:00', 5, 4),
(5, 'POST_PAYMENT', 30, '2024-04-14', 300000, 0, 15, 255000, 4490000, 4235000, '2024-03-15 11:05:00', 6, 5),
(6, 'POST_PAYMENT', 30, '2024-03-31', 100000, 0, 0, 100000, 900000, 800000, '2024-03-01 10:05:00', 8, 6),
(7, 'REFUND', 30, '2024-03-31', 100000, 0, 0, 100000, 800000, 900000, '2024-03-02 08:00:00', 8, 6),
(8, 'POST_PAYMENT', 30, '2024-03-02', 100000, 0, 5, 95000, 1000000, 905000, '2024-02-01 09:05:00', 9, 7),
(9, 'EXTEND', 30, '2024-04-01', 100000, 0, 5, 95000, 905000, 810000, '2024-03-01 09:05:00', 9, 7),
(10, 'POST_PAYMENT', 30, '2024-05-08', 600000, 0, 15, 510000, 4235000, 3725000, '2024-04-08 10:05:00', 6, 8),
(11, 'POST_PAYMENT', 30, '2024-05-12', 100000, 0, 0, 100000, 300000, 200000, '2024-04-12 07:05:00', 10, 9),
(12, 'POST_PAYMENT', 30, '2024-05-03', 100000, 0, 5, 95000, 1466750, 1371750, '2024-04-03 09:05:00', 5, 10),
(13, 'PUSH', NULL, NULL, 30000, 0, 10, 27000, 2640000, 2613000, '2024-04-15 09:05:00', 4, 2);

INSERT INTO favorites (user_id, post_id, created_at) VALUES
(5, 1, '2024-04-02 08:00:00'),
(5, 2, '2024-04-06 09:00:00'),
(7, 2, '2024-04-07 10:00:00'),
(7, 3, '2024-04-07 10:05:00'),
(9, 2, '2024-04-08 07:00:00'),
(9, 8, '2024-04-09 07:30:00'),
(10, 1, '2024-04-13 11:00:00'),
(10, 5, '2024-04-13 11:05:00');

INSERT INTO reports
(id, reason, description, status, created_at, resolved_at, resolution_note, user_id, post_id, moderator_id)
VALUES
(1, 'Anh dang khong phai anh that cua phong', 'Nguoi bao cao cho biet dia chi va anh khong khop thuc te.', 'RESOLVED', '2024-03-01 15:00:00', '2024-03-01 16:00:00', 'Da xac minh va tu choi bai dang.', 5, 6, 3),
(2, 'Chu phong khong lien lac duoc', 'So dien thoai sai hoac khong nghe may nhieu ngay.', 'PENDING', '2024-04-11 09:00:00', NULL, NULL, 7, 9, NULL),
(3, 'Gia dang khong dung thuc te', 'Nguoi xem lien he thi duoc bao gia khac voi bai dang.', 'REJECTED', '2024-04-02 11:00:00', '2024-04-02 14:00:00', 'Chua du bang chung de xu ly.', 10, 1, 3),
(4, 'Noi dung lua dao', 'Bai dang yeu cau coc truoc va dung dia chi khong ton tai.', 'RESOLVED', '2024-03-06 08:30:00', '2024-03-06 09:00:00', 'Da xoa bai dang va khoa tai khoan.', 4, 12, 3);

INSERT INTO report_images (id, image_url, updated_at, report_id) VALUES
(1, 'https://picsum.photos/seed/report-1/900/600', NOW(), 1),
(2, 'https://picsum.photos/seed/report-2/900/600', NOW(), 2),
(3, 'https://picsum.photos/seed/report-4/900/600', NOW(), 4);

INSERT INTO moderation_logs (id, action, target_type, target_id, reason, created_at, user_id) VALUES
(1, 'ACCEPT_POST', 'POST', 1, 'Bai dang hop le, duyet thanh cong', '2024-04-01 10:00:00', 3),
(2, 'ACCEPT_POST', 'POST', 2, 'Bai VIP hop le, duyet thanh cong', '2024-04-05 11:00:00', 3),
(3, 'ACCEPT_POST', 'POST', 3, 'Bai noi bat hop le', '2024-03-20 15:00:00', 3),
(4, 'REJECT_POST', 'POST', 6, 'Noi dung vi pham: anh gia, dia chi khong dung', '2024-03-01 16:00:00', 3),
(5, 'ACCEPT_REPORT', 'REPORT', 1, 'Bao cao co can cu', '2024-03-01 16:00:00', 3),
(6, 'WARNING', 'USER', 7, 'Dang tin thong tin sai lech lan 1', '2024-05-01 09:30:00', 3),
(7, 'LOCK_POST', 'USER', 9, 'Dang tin trung lap nhieu lan', '2024-05-10 10:00:00', 3),
(8, 'BAN_ACCOUNT', 'USER', 8, 'Lua dao tien coc, nhieu nguoi bao cao', '2024-06-01 08:30:00', 3),
(9, 'REMOVE_POST', 'POST', 12, 'Bai dang vi pham nghiem trong', '2024-03-06 09:00:00', 3);

INSERT INTO audit_logs (id, action, target_type, target_id, reason, created_at, user_id) VALUES
(1, 'APPROVE', 'POST', 1, 'Bai dang hop le, duyet thanh cong', '2024-04-01 10:00:00', 3),
(2, 'APPROVE', 'POST', 2, 'Bai VIP hop le, duyet thanh cong', '2024-04-05 11:00:00', 3),
(3, 'APPROVE', 'POST', 3, 'Bai noi bat hop le', '2024-03-20 15:00:00', 3),
(4, 'REJECT', 'POST', 6, 'Noi dung vi pham: anh gia, dia chi khong dung', '2024-03-01 16:00:00', 2),
(5, 'REFUND', 'TRANSACTION', 7, 'Hoan tien do bai dang bi tu choi', '2024-03-02 08:30:00', 2),
(6, 'BAN', 'USER', 8, 'Lua dao tien coc, nhieu nguoi bao cao', '2024-06-01 08:30:00', 1),
(7, 'CREATE', 'MEMBERSHIP', 3, 'Hang Vang cap nhat discount 10%', '2024-01-01 07:00:00', 1),
(8, 'UPDATE', 'POST', 10, 'Chu tin tu an bai de sua chua', '2024-04-14 08:05:00', 5),
(9, 'SYSTEM_BACKUP', 'SYSTEM', NULL, 'Ban ghi mau cho audit log he thong', '2024-04-20 02:00:00', 1);

INSERT INTO notifications (id, title, message, is_read, created_at, user_id) VALUES
(1, 'POST_INFORMATION', 'Bai dang "Phong tro gan DH Cong nghiep" da duoc duyet va hien thi.', TRUE, '2024-04-01 10:05:00', 4),
(2, 'POST_INFORMATION', 'Bai dang VIP "Phong full noi that, ban cong view dep" da duoc duyet.', TRUE, '2024-04-05 11:05:00', 4),
(3, 'POST_INFORMATION', 'Bai dang Noi bat "Nha nguyen can 3PN" da duoc duyet.', TRUE, '2024-03-20 15:05:00', 6),
(4, 'POST_INFORMATION', 'Bai dang cua ban da bi tu choi: anh gia, dia chi khong chinh xac.', TRUE, '2024-03-01 16:05:00', 8),
(5, 'POST_INFORMATION', 'Ban da duoc hoan 100,000d vao vi do bai dang bi tu choi.', TRUE, '2024-03-02 08:35:00', 8),
(6, 'POST_EXPIRING', 'Bai dang "Phong tro gan DH Cong nghiep" se het han sau 3 ngay.', FALSE, '2024-04-28 08:00:00', 4),
(7, 'POST_EXPIRING', 'Bai dang "Phong tro hem yen tinh, gan cho Thu Duc" da het han.', FALSE, '2024-03-01 09:05:00', 9),
(8, 'POST_INFORMATION', 'Bai dang "Can ho mini full noi that Q.7" da duoc duyet thanh cong.', FALSE, '2024-04-08 11:05:00', 6),
(9, 'SYSTEM_INFORMATION', 'Chao mung ban den voi PhongTro.vn. Hay nap tien de bat dau dang tin.', TRUE, '2024-04-10 08:01:00', 5),
(10, 'SYSTEM_INFORMATION', 'He thong se bao tri tu 02:00-04:00 ngay 20/04/2024.', TRUE, '2024-04-19 18:00:00', 4),
(11, 'SYSTEM_INFORMATION', 'He thong se bao tri tu 02:00-04:00 ngay 20/04/2024.', FALSE, '2024-04-19 18:00:00', 5),
(12, 'REPORT_INFORMATION', 'Bao cao cua ban da duoc tiep nhan va dang cho xu ly.', FALSE, '2024-04-11 09:01:00', 7);
