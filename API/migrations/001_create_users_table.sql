CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(255) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    `password` VARCHAR(255) NOT NULL,
    userType ENUM('aluno', 'professor') NOT NULL,
    nomeCompleto VARCHAR(255) NOT NULL,
    cpf VARCHAR(11) NOT NULL,
    dataNascimento VARCHAR(50),
    currentToken TEXT,
    lastLogin DATETIME,
    score INT DEFAULT 0,
    `rank` VARCHAR(50) DEFAULT 'Iniciante',
    `createdAt` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updatedAt` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_cpf (cpf),
    INDEX idx_userType (userType),
    INDEX idx_cpf_userType (cpf, userType)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

