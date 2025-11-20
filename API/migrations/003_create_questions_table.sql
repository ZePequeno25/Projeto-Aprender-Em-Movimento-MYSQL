CREATE TABLE IF NOT EXISTS questions (
    id VARCHAR(255) PRIMARY KEY,
    theme VARCHAR(255) NOT NULL,
    question_text TEXT NOT NULL,
    options_json JSON NOT NULL,
    correct_option_index INT NOT NULL,
    feedback_title VARCHAR(255),
    feedback_illustration TEXT,
    feedback_text TEXT,
    created_by VARCHAR(255) NOT NULL,
    updated_by VARCHAR(255) NULL,
    visibility ENUM('public', 'private') DEFAULT 'public',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_theme (theme),
    INDEX idx_visibility (visibility),
    INDEX idx_created_by (created_by),
    INDEX idx_updated_by (updated_by),
    INDEX idx_created_at (created_at),
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

