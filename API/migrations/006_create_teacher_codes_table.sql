CREATE TABLE IF NOT EXISTS teacher_codes (
    code VARCHAR(255) PRIMARY KEY,
    teacher_id VARCHAR(255) NOT NULL,
    expires_at DATETIME NOT NULL,
    used_by VARCHAR(255) NULL,
    used_at DATETIME NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_teacher_id (teacher_id),
    INDEX idx_expires_at (expires_at),
    INDEX idx_used_by (used_by),
    FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (used_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

