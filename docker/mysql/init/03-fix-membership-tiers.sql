-- Script sửa tên hạng thành viên (chạy 1 lần)
-- Sau khi chạy xong, restart backend để clear Redis cache hoặc gọi POST /api/membership/levels/refresh

USE phongtro_db;

-- Sửa tên từ tiếng Anh sang tiếng Việt
UPDATE membership_levels SET name = 'Sắt'     WHERE id = 1 AND (name = '' OR name = 'Sat');
UPDATE membership_levels SET name = 'Đồng'   WHERE id = 2 AND name = 'Dong';
UPDATE membership_levels SET name = 'Bạc'    WHERE id = 3 AND name = 'Bac';
UPDATE membership_levels SET name = 'Vàng'   WHERE id = 4 AND name = 'Vang';
UPDATE membership_levels SET name = 'Kim cương' WHERE id = 5 AND name = 'Kim cuong';

-- Verify
SELECT id, name, min_spent, discount_percent FROM membership_levels ORDER BY min_spent;
