const mysql = require('mysql2/promise');
const logger = require('./logger');

/**Pool de conexões MySQL */
let pool;

/**Inicializa o pool de conexões MySQL */
const initDatabase = () => {
  try {
    /**Verifica se as variáveis de ambiente do banco de dados estão definidas */
    if (!process.env.DB_HOST || !process.env.DB_USER || !process.env.DB_PASSWORD || !process.env.DB_NAME) {
      logger.error('Variáveis de ambiente do banco de dados não definidas', 'DATABASE');
      throw new Error('Variáveis de ambiente do banco de dados não definidas');
    }

    /**Cria o pool de conexões MySQL */
    pool = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      enableKeepAlive: true,
      keepAliveInitialDelay: 0
    });

    /**Loga a inicialização do pool de conexões MySQL */
    logger.info('Pool de conexões MySQL inicializado com sucesso', 'DATABASE');
    /**Retorna o pool de conexões MySQL */
    return pool;
  } catch (error) {
    /**Loga o erro ao inicializar o pool de conexões MySQL */
    logger.error(`Erro ao inicializar pool MySQL: ${error.message}`, 'DATABASE', { stack: error.stack });
    throw error;
  }
};

/**Retorna o pool de conexões MySQL */
const getPool = () => {
  /**Verifica se o pool de conexões MySQL está inicializado */
  if (!pool) {
    return initDatabase();
  }
  /**Retorna o pool de conexões MySQL */
  return pool;
};

/**Exporta o pool de conexões MySQL */
module.exports = { getPool, pool };

