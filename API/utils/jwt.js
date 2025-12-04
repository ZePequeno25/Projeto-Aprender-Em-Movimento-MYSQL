const jwt = require('jsonwebtoken');
const logger = require('./logger');

/**Chave secreta para o token JWT */
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
/**Tempo de expiração do token JWT */
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

/**Gera o token JWT */
const generateToken = (userId, email, userType) => {
  try {
    /**Payload do token JWT */
    const payload = {
      uid: userId,
      userId: userId,
      email: email,
      userType: userType
    };
    
    /**Gera o token JWT */
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
    return token;
  } catch (error) {
    logger.error(`Erro ao gerar token JWT: ${error.message}`, 'JWT');
    throw error;
  }
};

/**Verifica o token JWT */
const verifyToken = async (token) => {
  try {
    /**Decodifica o token JWT */
    const decoded = jwt.verify(token, JWT_SECRET);
    /**Retorna o payload do token JWT */
    return decoded;
  } catch (error) {
    /**Verifica se o token expirou */
    if (error.name === 'TokenExpiredError') {
      /**Retorna o erro */
      throw new Error('Token expirado');ww
    } 
    /**Verifica se o token é inválido */
    else if (error.name === 'JsonWebTokenError') {
      /**Retorna o erro */
      throw new Error('Token inválido');
    }
    /**Retorna o erro */
    throw error;
  }
};

/**Exporta o módulo jwt */
module.exports = { generateToken, verifyToken };

