const { verifyToken } = require('../utils/jwt');
const logger = require('../utils/logger');

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('❌ [authMiddleware] Header Authorization inválido ou faltando');
      return res.status(401).json({ error: 'Token de autenticação não fornecido' });
    }

    const token = authHeader.replace('Bearer ', '');
    
    console.log('🔐 [authMiddleware] Verificando token JWT...');
    
    // ✅ VALIDAÇÃO com JWT
    const decodedToken = await verifyToken(token);
    
    req.user = {
      uid: decodedToken.uid || decodedToken.userId,
      userId: decodedToken.userId || decodedToken.uid,
      email: decodedToken.email,
      userType: decodedToken.userType
    };
    req.userId = decodedToken.userId || decodedToken.uid;
    req.teacherId = decodedToken.userId || decodedToken.uid;
    
    console.log(`✅ [authMiddleware] Usuário autenticado: ${req.userId}`);
    next();

  } catch (error) {
    console.error('❌ [authMiddleware] Token inválido:', error.message);
    return res.status(401).json({ error: 'Token de autenticação inválido' });
  }
};

module.exports = authMiddleware;
