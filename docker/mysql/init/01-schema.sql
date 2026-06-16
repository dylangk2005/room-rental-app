CREATE DATABASE IF NOT EXISTS phongtro_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE phongtro_db;

CREATE TABLE IF NOT EXISTS provinces (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS districts (
    id INT PRIMARY KEY AUTO_INCREMENT,
    province_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_districts_province FOREIGN KEY (province_id) REFERENCES provinces(id),
    INDEX idx_districts_province_id (province_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS roles (
    role_id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(50),
    description TEXT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS membership_levels (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100),
    min_spent DECIMAL(12,2),
    discount_percent INT,
    updated_at TIMESTAMP NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    full_name VARCHAR(255),
    email VARCHAR(255) UNIQUE,
    password VARCHAR(255),
    phone_number VARCHAR(20) UNIQUE,
    avatar TEXT,
    status ENUM('ACTIVE', 'INACTIVE', 'BANNED') DEFAULT 'INACTIVE',
    account_balance DECIMAL(12,2) DEFAULT 0,
    total_spent DECIMAL(12,2) DEFAULT 0,
    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    role_id INT,
    membership_level_id INT,
    must_change_password BOOLEAN DEFAULT FALSE,
    CONSTRAINT fk_users_role FOREIGN KEY (role_id) REFERENCES roles(role_id),
    CONSTRAINT fk_users_membership FOREIGN KEY (membership_level_id) REFERENCES membership_levels(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS user_penalties (
    id INT PRIMARY KEY AUTO_INCREMENT,
    type ENUM('WARNING', 'LOCK_POST', 'BAN_ACCOUNT'),
    reason TEXT,
    start_date TIMESTAMP NULL,
    end_date TIMESTAMP NULL,
    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    user_id INT,
    CONSTRAINT fk_user_penalties_user FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS deposits (
    id INT PRIMARY KEY AUTO_INCREMENT,
    amount DECIMAL(12,2),
    tax DECIMAL(12,2),
    net_amount DECIMAL(12,2),
    method ENUM('BANK_TRANSFER', 'VNPAY'),
    status ENUM('PENDING', 'SUCCESS', 'FAILED', 'CANCELLED') DEFAULT 'PENDING',
    transaction_ref VARCHAR(100) UNIQUE,
    gateway_transaction_no VARCHAR(100),
    opening_balance DECIMAL(12,2),
    closing_balance DECIMAL(12,2),
    note TEXT,
    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    user_id INT,
    CONSTRAINT fk_deposits_user FOREIGN KEY (user_id) REFERENCES users(id),
    INDEX idx_deposits_user_id (user_id),
    INDEX idx_deposits_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS post_types (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100),
    title_color VARCHAR(20),
    title_size INT,
    priority INT,
    push_price DECIMAL(12,2),
    is_uppercase BOOLEAN DEFAULT FALSE,
    has_recommend_tag BOOLEAN DEFAULT FALSE,
    max_image_limit INT DEFAULT 1,
    updated_at TIMESTAMP NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS post_type_prices (
    post_type_id INT,
    day INT,
    price DECIMAL(12,2),
    PRIMARY KEY (post_type_id, day),
    CONSTRAINT fk_post_type_prices_post_type FOREIGN KEY (post_type_id) REFERENCES post_types(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS posts (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(255),
    description TEXT,
    address TEXT,
    province_id INT NOT NULL,
    district_id INT NOT NULL,
    area DECIMAL(6,2),
    rental_price DECIMAL(12,2),
    status ENUM('DRAFT', 'PENDING', 'ACTIVE', 'EXPIRED', 'REJECTED', 'HIDDEN', 'DELETED') DEFAULT 'PENDING',
    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL,
    push_time TIMESTAMP NULL,
    end_at TIMESTAMP NULL,
    user_id INT,
    post_type_id INT,
    duration_days INT,
    CONSTRAINT fk_posts_user FOREIGN KEY (user_id) REFERENCES users(id),
    CONSTRAINT fk_posts_post_type FOREIGN KEY (post_type_id) REFERENCES post_types(id),
    CONSTRAINT fk_posts_province FOREIGN KEY (province_id) REFERENCES provinces(id),
    CONSTRAINT fk_posts_district FOREIGN KEY (district_id) REFERENCES districts(id),
    INDEX idx_posts_user_id (user_id),
    INDEX idx_posts_post_type_id (post_type_id),
    INDEX idx_posts_status (status),
    INDEX idx_posts_end_at (end_at),
    INDEX idx_posts_push_time (push_time),
    INDEX idx_posts_province_id (province_id),
    INDEX idx_posts_district_id (district_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS post_images (
    id INT PRIMARY KEY AUTO_INCREMENT,
    image_url TEXT,
    updated_at TIMESTAMP NULL,
    post_id INT,
    CONSTRAINT fk_post_images_post FOREIGN KEY (post_id) REFERENCES posts(id),
    INDEX idx_post_images_post_id (post_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS payments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    payment_type ENUM('POST_PAYMENT', 'EXTEND', 'REFUND', 'PUSH'),
    days INT,
    day_end DATE,
    base_fee DECIMAL(12,2),
    tax DECIMAL(12,2),
    discount_percent INT,
    final_fee DECIMAL(12,2),
    opening_balance DECIMAL(12,2),
    closing_balance DECIMAL(12,2),
    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    user_id INT,
    post_id INT,
    CONSTRAINT fk_payments_user FOREIGN KEY (user_id) REFERENCES users(id),
    CONSTRAINT fk_payments_post FOREIGN KEY (post_id) REFERENCES posts(id),
    INDEX idx_payments_user_id (user_id),
    INDEX idx_payments_post_id (post_id),
    INDEX idx_payments_type (payment_type),
    INDEX idx_payments_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS favorites (
    user_id INT,
    post_id INT,
    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, post_id),
    CONSTRAINT fk_favorites_user FOREIGN KEY (user_id) REFERENCES users(id),
    CONSTRAINT fk_favorites_post FOREIGN KEY (post_id) REFERENCES posts(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS reports (
    id INT PRIMARY KEY AUTO_INCREMENT,
    reason TEXT,
    description TEXT,
    status ENUM('PENDING', 'RESOLVED', 'REJECTED') DEFAULT 'PENDING',
    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP NULL,
    resolution_note TEXT,
    user_id INT,
    post_id INT,
    moderator_id INT,
    CONSTRAINT fk_reports_user FOREIGN KEY (user_id) REFERENCES users(id),
    CONSTRAINT fk_reports_post FOREIGN KEY (post_id) REFERENCES posts(id),
    CONSTRAINT fk_reports_moderator FOREIGN KEY (moderator_id) REFERENCES users(id),
    INDEX idx_reports_status (status),
    INDEX idx_reports_user_id (user_id),
    INDEX idx_reports_post_id (post_id),
    INDEX idx_reports_moderator_id (moderator_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS report_images (
    id INT PRIMARY KEY AUTO_INCREMENT,
    image_url TEXT,
    updated_at TIMESTAMP NULL,
    report_id INT,
    CONSTRAINT fk_report_images_report FOREIGN KEY (report_id) REFERENCES reports(id),
    INDEX idx_report_images_report_id (report_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS moderation_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    action ENUM(
        'ACCEPT_POST',
        'REJECT_POST',
        'HIDDEN_POST',
        'REMOVE_POST',
        'ACCEPT_REPORT',
        'REJECT_REPORT',
        'WARNING',
        'LOCK_POST',
        'BAN_ACCOUNT'
    ),
    target_type ENUM('POST', 'REPORT', 'USER'),
    target_id INT,
    reason TEXT,
    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    user_id INT,
    CONSTRAINT fk_moderation_logs_user FOREIGN KEY (user_id) REFERENCES users(id),
    INDEX idx_moderation_logs_user_id (user_id),
    INDEX idx_moderation_logs_target_id (target_id),
    INDEX idx_moderation_logs_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS audit_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    action VARCHAR(100),
    target_type ENUM('SYSTEM', 'USER', 'POST', 'TRANSACTION', 'REPORT', 'DEPOSIT', 'MEMBERSHIP'),
    target_id INT,
    reason TEXT,
    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    user_id INT,
    CONSTRAINT fk_audit_logs_user FOREIGN KEY (user_id) REFERENCES users(id),
    INDEX idx_audit_logs_user_id (user_id),
    INDEX idx_audit_logs_target_id (target_id),
    INDEX idx_audit_logs_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS notifications (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title ENUM('POST_INFORMATION', 'REPORT_INFORMATION', 'POST_EXPIRING', 'SYSTEM_INFORMATION'),
    message TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    user_id INT,
    CONSTRAINT fk_notifications_user FOREIGN KEY (user_id) REFERENCES users(id),
    INDEX idx_notifications_user_id (user_id),
    INDEX idx_notifications_is_read (is_read),
    INDEX idx_notifications_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
