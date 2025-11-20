const { getPool } = require('../utils/database');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

// Função helper para formatar data no formato MySQL (YYYY-MM-DD HH:MM:SS)
const formatDateForMySQL = (date) => {
  if (!date) return null;
  const d = date instanceof Date ? date : new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};

const createUser = async (userData) => {
  try {
    const pool = getPool();
    const { userId, ...data } = userData;
    
    const now = new Date();
    const createdAt = formatDateForMySQL(data.createdAt || now);
    const updatedAt = formatDateForMySQL(data.updatedAt || now);
    
    const [result] = await pool.execute(
      `INSERT INTO users (id, email, password, userType, nomeCompleto, cpf, dataNascimento, createdAt, updatedAt) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        data.email,
        data.password,
        data.userType,
        data.nomeCompleto,
        data.cpf,
        data.dataNascimento,
        createdAt,
        updatedAt
      ]
    );
    
    return result;
  } catch (error) {
    throw new Error(`Erro ao criar usuário: ${error.message}`);
  }
};

const verifyUserCredentials = async (email, password) => {
  try {
    const pool = getPool();
    const [rows] = await pool.execute(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );

    if (rows.length === 0) {
      return null;
    }

    const user = rows[0];
    const passwordMatch = await bcrypt.compare(password, user.password);
    
    if (!passwordMatch) {
      return null;
    }

    return { ...user, userId: user.id };
  } catch (error) {
    throw new Error(`Erro ao verificar credenciais: ${error.message}`);
  }
};

const verifyUserPasswordReset = async (email, dataNascimento) => {
    try {
        console.log('🔍 [userModel] Verificando usuário para reset de senha:', { email });
        
    const pool = getPool();
    const [rows] = await pool.execute(
      'SELECT * FROM users WHERE email = ? AND dataNascimento = ?',
      [email, dataNascimento]
    );

    console.log('📊 [userModel] Resultado da busca:', { encontrou: rows.length > 0 });

    if (rows.length === 0) {
            return null;
        }

    const user = rows[0];
        
        console.log('✅ [userModel] Usuário encontrado:', { 
      userId: user.id,
            email: user.email 
        });
        
    return { ...user, userId: user.id };

    } catch (error) {
        console.error('❌ [userModel] Erro ao verificar usuário:', error);
        throw new Error(`Erro ao verificar usuário para redefinição de senha: ${error.message}`);
    }
};

const verifyUserByCpfForPasswordReset = async (cpf, userType) => {
    try {
        console.log('🔍 [userModel] Verificando usuário por CPF para reset:', { 
            cpf: cpf.substring(0, 3) + '***',
            userType 
        });
        
    const pool = getPool();
    const [rows] = await pool.execute(
      'SELECT * FROM users WHERE cpf = ? AND userType = ?',
      [cpf, userType]
    );

        console.log('📊 [userModel] Resultado da busca por CPF:', { 
      encontrou: rows.length > 0,
      quantidade: rows.length 
        });

    if (rows.length === 0) {
            console.log('❌ [userModel] Nenhum usuário encontrado com este CPF e userType');
            return null;
        }

    const user = rows[0];
        
        console.log('✅ [userModel] Usuário encontrado por CPF:', { 
      userId: user.id,
            email: user.email,
            nome: user.nomeCompleto
        });
        
        return { 
            ...user, 
      userId: user.id 
        };

    } catch (error) {
        console.error('❌ [userModel] Erro ao verificar usuário por CPF:', error);
        throw new Error(`Erro ao verificar usuário por CPF: ${error.message}`);
    }
};

const resetUserPassword = async (userId, newPassword) => {
    try {
        console.log('🔐 [userModel] Redefinindo senha para usuário:', userId);
        
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        
    const pool = getPool();
    const updatedAt = formatDateForMySQL(new Date());
    await pool.execute(
      'UPDATE users SET password = ?, updatedAt = ? WHERE id = ?',
      [hashedPassword, updatedAt, userId]
    );
        
    console.log('✅ [userModel] Senha atualizada no MySQL');

    } catch (error) {
        console.error('❌ [userModel] Erro ao redefinir senha:', error);
        throw new Error(`Erro ao redefinir senha: ${error.message}`);
    }
};

const isProfessor = async (userId) => {
  try {
    console.log('🔍 [userModel] Verificando se usuário é professor:', userId);
    
    const pool = getPool();
    const [rows] = await pool.execute(
      'SELECT userType FROM users WHERE id = ?',
      [userId]
    );
    
    if (rows.length === 0) {
      console.log('❌ [userModel] Usuário não encontrado');
      return false;
    }

    const userData = rows[0];
    const isProf = userData.userType === 'professor';
    
    console.log('✅ [userModel] Resultado da verificação:', { 
      userId, 
      userType: userData.userType, 
      isProfessor: isProf 
    });
    
    return isProf;
  } catch (error) {
    console.error('❌ [userModel] Erro ao verificar se é professor:', error);
    throw new Error(`Erro ao verificar permissões: ${error.message}`);
  }
};

const isStudent = async (userId) => {
  try {
    const pool = getPool();
    const [rows] = await pool.execute(
      'SELECT userType FROM users WHERE id = ?',
      [userId]
    );
    
    if (rows.length === 0) {
      return false;
    }

    return rows[0].userType === 'aluno';
  } catch (error) {
    throw new Error(`Erro ao verificar se é aluno: ${error.message}`);
  }
};

const getUserName = async (userId) => {
  try {
    const pool = getPool();
    const [rows] = await pool.execute(
      'SELECT nomeCompleto FROM users WHERE id = ?',
      [userId]
    );
    
    if (rows.length === 0) {
      return null;
    }

    return rows[0].nomeCompleto;
  } catch (error) {
    throw new Error(`Erro ao buscar nome do usuário: ${error.message}`);
  }
};

module.exports = { 
  createUser, 
  verifyUserCredentials, 
  verifyUserPasswordReset, 
  resetUserPassword, 
  verifyUserByCpfForPasswordReset, 
  isProfessor,
  isStudent,
  getUserName,
  formatDateForMySQL
};
