const { getPool } = require('../utils/database');
const logger = require('../utils/logger');

const createTeacherCode = async (teacherId, code) => {
  try {
    const pool = getPool();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 horas
    
    // Invalidar todos os códigos antigos do professor (marcar como expirados)
    await pool.execute(
      `UPDATE teacher_codes 
       SET expires_at = NOW() - INTERVAL 1 DAY
       WHERE teacher_id = ? AND expires_at > NOW()`,
      [teacherId]
    );
    
    // Verificar se o novo código já existe
    const [existing] = await pool.execute(
      'SELECT * FROM teacher_codes WHERE code = ?',
      [code]
    );
    
    if (existing.length > 0) {
      // Se já existe (mesmo código), atualizar para este professor
      await pool.execute(
        `UPDATE teacher_codes 
         SET expires_at = ?, used_by = NULL, used_at = NULL, created_at = ?, teacher_id = ?
         WHERE code = ?`,
        [expiresAt, new Date(), teacherId, code]
      );
      
      logger.info(`Código existente atualizado para professor ${teacherId}: ${code}`);
    } else {
      // Se não existe, criar novo
      await pool.execute(
        `INSERT INTO teacher_codes (code, teacher_id, expires_at, used_by, created_at) 
         VALUES (?, ?, ?, NULL, ?)`,
        [code, teacherId, expiresAt, new Date()]
      );
      
      logger.info(`Novo código criado para professor ${teacherId}: ${code}`);
    }
    
    return {
      teacher_id: teacherId,
      code,
      expires_at: expiresAt,
      used_by: null,
      created_at: new Date()
    };
  } catch (error) {
    logger.error(`Erro ao criar/atualizar código para professor ${teacherId}: ${error.message}`);
    throw error;
  }
};

const getTeacherCode = async (teacherId) => {
  try {
    const pool = getPool();
    const [rows] = await pool.execute(
      'SELECT * FROM teacher_codes WHERE teacher_id = ? AND expires_at > NOW() ORDER BY created_at DESC LIMIT 1',
      [teacherId]
    );
            
    if (rows.length === 0) return null;
        
    const codeData = rows[0];
    return {
      code: codeData.code,
      teacher_id: codeData.teacher_id,
      expires_at: codeData.expires_at,
      used_by: codeData.used_by,
      used_at: codeData.used_at,
      created_at: codeData.created_at
    };
  } catch (error) {
        logger.error(`Erro ao buscar código do professor ${teacherId}: ${error.message}`);
        throw error;
    }
};

const useTeacherCode = async (code, studentId) => {
  try {
    const pool = getPool();
    
    // Buscar código não usado
    const [rows] = await pool.execute(
      'SELECT * FROM teacher_codes WHERE code = ? AND used_by IS NULL',
      [code]
    );
            
    if (rows.length === 0) return null;
        
    const codeData = rows[0];
    
    // Verificar expiração
    if (new Date(codeData.expires_at) < new Date()) {
      return null;
    }
    
    // Marcar como usado
    await pool.execute(
      'UPDATE teacher_codes SET used_by = ?, used_at = ? WHERE code = ?',
      [studentId, new Date(), code]
    );
    
    return {
      code: codeData.code,
      teacher_id: codeData.teacher_id,
      expires_at: codeData.expires_at,
            used_by: studentId,
      used_at: new Date()
    };
  } catch (error) {
        logger.error(`Erro ao usar código ${code}: ${error.message}`);
        throw error;
    }
};

module.exports = { createTeacherCode, getTeacherCode, useTeacherCode };
