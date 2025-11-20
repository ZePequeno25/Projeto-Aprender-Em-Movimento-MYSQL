const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

const runMigrations = async () => {
  let connection;
  
  try {
    const dbConfig = {
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'aprender_em_movimento',
      multipleStatements: true
    };

    // Conectar sem especificar database para garantir criação prévia
    connection = await mysql.createConnection({
      host: dbConfig.host,
      user: dbConfig.user,
      password: dbConfig.password,
      multipleStatements: true
    });

    logger.info(`Verificando base de dados "${dbConfig.database}"`, 'MIGRATIONS');
    await connection.query(
      `CREATE DATABASE IF NOT EXISTS \`${dbConfig.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
    );
    await connection.changeUser({ database: dbConfig.database });

    logger.info('Conectado ao banco de dados MySQL', 'MIGRATIONS');

    // Ler arquivos de migração em ordem
    const migrationsDir = path.join(__dirname);
    const migrationFiles = [
      '001_create_users_table.sql',
      '002_create_chats_table.sql',
      '003_create_questions_table.sql',
      '004_create_comments_table.sql',
      '005_create_comments_responses_table.sql',
      '006_create_teacher_codes_table.sql',
      '007_create_teacher_students_table.sql'
    ];

    for (const file of migrationFiles) {
      const filePath = path.join(migrationsDir, file);
      if (fs.existsSync(filePath)) {
        const sql = fs.readFileSync(filePath, 'utf8');
        logger.info(`Executando migração: ${file}`, 'MIGRATIONS');
        await connection.query(sql);
        logger.info(`✅ Migração ${file} executada com sucesso`, 'MIGRATIONS');
      } else {
        logger.warn(`Arquivo de migração não encontrado: ${file}`, 'MIGRATIONS');
      }
    }

    logger.info('Todas as migrações foram executadas com sucesso', 'MIGRATIONS');
    
  } catch (error) {
    logger.error(`Erro ao executar migrações: ${error.message}`, 'MIGRATIONS', { stack: error.stack });
    throw error;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
};

// Executar se chamado diretamente
if (require.main === module) {
  require('dotenv').config();
  runMigrations()
    .then(() => {
      console.log('Migrações concluídas');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Erro ao executar migrações:', error);
      process.exit(1);
    });
}

module.exports = { runMigrations };

