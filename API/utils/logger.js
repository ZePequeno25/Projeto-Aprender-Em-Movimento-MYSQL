const winston = require('winston');
const path = require('path');

/**Obtém as informações do chamador */
const getCallerInfo = () => {
  const stack = new Error().stack.split('\n');
  for (let i = 4; i < stack.length; i++) {
    /**Obtém a linha do chamador */
    const callerLine = stack[i] || '';
    const match = callerLine.match(/\(([^:]+):(\d+):(\d+)\)/) || callerLine.match(/at\s+(.+):(\d+):(\d+)/);
    if (match) {
      /**Obtém o arquivo do chamador */
      const file = path.basename(match[1]);
      if (!file.includes('winston') && !file.includes('node_modules') && !file.includes('logger.js')) {
        /**Retorna o arquivo e a linha do chamador */
        return { file, line: match[2] };
      }
    }
  }
  /**Retorna o arquivo e a linha do chamador */
  return { file: 'unknown', line: 'unknown' };
};

/**Formata as mensagens de log */
const customFormat = winston.format((info) => {
  const callerInfo = getCallerInfo();
  /**Obtém o arquivo e a linha do chamador */
  info.file = callerInfo.file;
  /**Obtém a linha do chamador */
  info.line = callerInfo.line;
  /**Obtém o stack trace do chamador */
  if (info.level === 'error' && info.stack) {
    /**Obtém o stack trace do chamador */
    info.stackTrace = info.stack;
  }
  /**Retorna o info */
  return info;
});

/**Cria o logger */
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    customFormat(),
    winston.format.json()
  ),
  transports: [
    /**Console */
    new winston.transports.Console(),
    /**Arquivo de erro */
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    /**Arquivo de log combinado */
    new winston.transports.File({ filename: 'combined.log' })
  ],
});

/**Exporta o logger */
module.exports = {
  logRequest: (req, context) => {
    /**Loga a requisição recebida */
    logger.info(`Requisição recebida: ${req.method} ${req.url}`, context, {
      /**Loga o método da requisição */
      method: req.method,
      /**Loga o url da requisição */
      url: req.url,
      /**Loga os headers da requisição */
      headers: req.headers,
      /**Loga o body da requisição */
      body: req.body,
    });
  },
  /**Loga a autenticação */
  logAuth: (action, userId, success, meta) => {
    /**Loga a autenticação */
    logger.info(`${action} ${success ? 'bem-sucedido' : 'falhou'} para usuário ${userId}`, 'AUTH', {
      userId,
      success,
      ...meta,
    });
  },
  /**Loga o erro */
  logError: (error, context) => {
    /**Loga o erro */
    logger.error(error.message, context, { stack: error.stack });
  },
  /**Loga a informação */
  info: (message, context, meta) => logger.info(message, context, meta),
  /**Loga o aviso */
  warn: (message, context, meta) => logger.warn(message, context, meta),
  /**Loga o debug */
  debug: (message, context, meta) => logger.debug(message, context, meta),
  /**Loga o erro */
  error: (message, context, meta) => logger.error(message, context, meta),
};