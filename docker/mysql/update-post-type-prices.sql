INSERT INTO post_types (id, name, title_color, title_size, priority, push_price, updated_at) VALUES
(1, 'Tin thường', '#111827', 14, 4, 2000, NOW()),
(2, 'Tin VIP2', '#0F766E', 15, 3, 2000, NOW()),
(3, 'Tin VIP1', '#DB2777', 16, 2, 3000, NOW()),
(4, 'Tin Vip Nổi Bật', '#DC2626', 18, 1, 5000, NOW())
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    title_color = VALUES(title_color),
    title_size = VALUES(title_size),
    priority = VALUES(priority),
    push_price = VALUES(push_price),
    updated_at = NOW();

DELETE FROM post_type_prices
WHERE post_type_id IN (1, 2, 3, 4)
  AND day NOT IN (5, 10, 15, 30);

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
(4, 30, 900000)
ON DUPLICATE KEY UPDATE
    price = VALUES(price);
