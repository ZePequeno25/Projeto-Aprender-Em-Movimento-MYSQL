const { getPool } = require('../utils/database');
const logger = require('../utils/logger');
const { v4: uuidv4 } = require('uuid');

const addQuestion = async (questionData) => {
  try {
    const pool = getPool();
    const questionId = uuidv4();
    
    await pool.execute(
      `INSERT INTO questions (id, theme, question_text, options_json, correct_option_index, 
        feedback_title, feedback_illustration, feedback_text, created_by, visibility, created_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        questionId,
        questionData.theme,
        questionData.question_text,
        JSON.stringify(questionData.options_json),
        questionData.correct_option_index,
        questionData.feedback_title || '',
        questionData.feedback_illustration || '',
        questionData.feedback_text || '',
        questionData.created_by,
        questionData.visibility || 'public',
        new Date()
      ]
    );
    
    console.log(`✅ [questionModel] Questão criada: ${questionId}`);
    return questionId;
  } catch (error) {
    console.error(`Erro ao adicionar questão: ${error.message}`);
    throw error;
  }
};

const getQuestions = async (visibility = null, linkedTeacherIds = []) => {
  try {
    const pool = getPool();
    let query = 'SELECT * FROM questions';
    let params = [];
    let conditions = [];
    
    if (visibility) {
      // Se visibility é 'public', buscar públicas OU privadas de professores vinculados
      if (visibility === 'public' && linkedTeacherIds.length > 0) {
        const placeholders = linkedTeacherIds.map(() => '?').join(',');
        conditions.push(`(visibility = 'public' OR (visibility = 'private' AND created_by IN (${placeholders})))`);
        params.push(...linkedTeacherIds);
      } else {
        conditions.push('visibility = ?');
        params.push(visibility);
      }
    } else if (linkedTeacherIds.length > 0) {
      // Se não especificou visibility mas tem professores vinculados, incluir privadas deles
      const placeholders = linkedTeacherIds.map(() => '?').join(',');
      conditions.push(`(visibility = 'public' OR (visibility = 'private' AND created_by IN (${placeholders})))`);
      params.push(...linkedTeacherIds);
    }
    
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    
    query += ' ORDER BY created_at DESC';
    
    const [rows] = await pool.execute(query, params);
    
    return rows.map(row => ({
      id: row.id,
      theme: row.theme,
      question_text: row.question_text,
      options_json: typeof row.options_json === 'string' ? JSON.parse(row.options_json) : row.options_json,
      correct_option_index: row.correct_option_index,
      feedback_title: row.feedback_title,
      feedback_illustration: row.feedback_illustration,
      feedback_text: row.feedback_text,
      created_by: row.created_by,
      visibility: row.visibility,
      created_at: row.created_at ? row.created_at.toISOString() : null,
      updated_at: row.updated_at ? row.updated_at.toISOString() : null,
      createdAt: row.created_at ? row.created_at.toISOString() : null
    }));
  } catch (error) {
    logger.error(`Erro ao listar perguntas: ${error.message}`);
    throw error;
  }
};

const updateQuestion = async (questionId, questionData) => {
  try {
    const pool = getPool();
    
    const updateFields = [];
    const updateValues = [];
    
    if (questionData.theme !== undefined) {
      updateFields.push('theme = ?');
      updateValues.push(questionData.theme);
    }
    if (questionData.question_text !== undefined) {
      updateFields.push('question_text = ?');
      updateValues.push(questionData.question_text);
    }
    if (questionData.options_json !== undefined) {
      updateFields.push('options_json = ?');
      updateValues.push(JSON.stringify(questionData.options_json));
    }
    if (questionData.correct_option_index !== undefined) {
      updateFields.push('correct_option_index = ?');
      updateValues.push(questionData.correct_option_index);
    }
    if (questionData.feedback_title !== undefined) {
      updateFields.push('feedback_title = ?');
      updateValues.push(questionData.feedback_title);
    }
    if (questionData.feedback_illustration !== undefined) {
      updateFields.push('feedback_illustration = ?');
      updateValues.push(questionData.feedback_illustration);
    }
    if (questionData.feedback_text !== undefined) {
      updateFields.push('feedback_text = ?');
      updateValues.push(questionData.feedback_text);
    }
    if (questionData.visibility !== undefined) {
      updateFields.push('visibility = ?');
      updateValues.push(questionData.visibility);
    }
    if (questionData.updated_by !== undefined) {
      updateFields.push('updated_by = ?');
      updateValues.push(questionData.updated_by);
    }
    
    updateFields.push('updated_at = ?');
    updateValues.push(new Date());
    updateValues.push(questionId);
    
    await pool.execute(
      `UPDATE questions SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    );
    
    console.log(`✅ [questionModel] Questão atualizada: ${questionId}`);
  } catch (error) {
    console.error(`Erro ao atualizar questão ${questionId}: ${error.message}`);
    throw error;
  }
};

const deleteQuestion = async (questionId) => {
  try {
    const pool = getPool();
    await pool.execute('DELETE FROM questions WHERE id = ?', [questionId]);
    console.log(`✅ [questionModel] Questão deletada: ${questionId}`);
  } catch (error) {
    logger.error(`Erro ao deletar pergunta ${questionId}: ${error.message}`);
    throw error;
  }
};

module.exports = {
  addQuestion,
  getQuestions,
  updateQuestion,
  deleteQuestion
};
