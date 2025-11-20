const { getPool } = require('../utils/database');
const logger = require('../utils/logger');
const { v4: uuidv4 } = require('uuid');

const addComment = async (commentData) => {
  try {
    const pool = getPool();
    const commentId = uuidv4();
    
    await pool.execute(
      `INSERT INTO comments (id, question_id, question_theme, question_text, user_id, user_name, user_type, message, created_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        commentId,
        commentData.question_id,
        commentData.question_theme,
        commentData.question_text,
        commentData.user_id,
        commentData.user_name,
        commentData.user_type,
        commentData.message,
        new Date()
      ]
    );
    
    return commentId;
  } catch (error) {
        logger.error(`Erro ao adicionar comentário: ${error.message}`);
        throw error;
    }
};

const getTeacherComments = async (teacherId) => {
  try {
    console.log(`🔍 [commentModel] Buscando comentários para o professor: ${teacherId}`);
    
    const pool = getPool();
    
    // Verificar se o professor existe
    const [teacherRows] = await pool.execute(
      'SELECT * FROM users WHERE id = ? AND userType = ?',
      [teacherId, 'professor']
    );
    
    if (teacherRows.length === 0) {
      console.log(`❌ [commentModel] Professor não encontrado: ${teacherId}`);
      return [];
    }

    // Buscar alunos vinculados ao professor
    const [studentRows] = await pool.execute(
      'SELECT student_id FROM teacher_students WHERE teacher_id = ?',
      [teacherId]
    );
    
    const studentIds = studentRows.map(row => row.student_id);
    console.log(`📊 [commentModel] ${studentIds.length} alunos vinculados encontrados`);

    const comments = [];
    const commentIdsSet = new Set(); // Para evitar duplicatas
    
    // 1. Buscar comentários de alunos vinculados
    if (studentIds.length > 0) {
      const placeholders = studentIds.map(() => '?').join(',');
      const [commentRows] = await pool.execute(
        `SELECT c.* FROM comments c
         WHERE c.user_id IN (${placeholders})
         ORDER BY c.created_at DESC`,
        studentIds
      );
      
      console.log(`💬 [commentModel] ${commentRows.length} comentários de alunos vinculados encontrados`);
      
      for (const commentRow of commentRows) {
        if (!commentIdsSet.has(commentRow.id)) {
          commentIdsSet.add(commentRow.id);
          
          // Buscar respostas
          let responses = [];
          try {
            const [responseRows] = await pool.execute(
              'SELECT * FROM comments_responses WHERE comment_id = ? ORDER BY created_at ASC',
              [commentRow.id]
            );
              
            responses = responseRows.map(r => ({
              id: r.id,
              comment_id: r.comment_id,
              user_id: r.user_id,
              user_name: r.user_name,
              user_type: r.user_type,
              message: r.message,
              created_at: r.created_at ? r.created_at.toISOString() : null
            }));
          } catch (error) {
            console.warn(`⚠️ [commentModel] Erro ao buscar respostas: ${error.message}`);
          }
          
          comments.push({
            id: commentRow.id,
            question_id: commentRow.question_id,
            question_theme: commentRow.question_theme,
            question_text: commentRow.question_text,
            user_id: commentRow.user_id,
            user_name: commentRow.user_name,
            user_type: commentRow.user_type,
            message: commentRow.message,
            created_at: commentRow.created_at ? commentRow.created_at.toISOString() : null,
            responses
          });
        }
      }
    }
    
    // 2. Buscar comentários em questões públicas criadas pelo professor (independente de vínculo)
    const [publicQuestionComments] = await pool.execute(
      `SELECT c.* FROM comments c
       INNER JOIN questions q ON c.question_id = q.id
       WHERE q.created_by = ? AND q.visibility = 'public'
       ORDER BY c.created_at DESC`,
      [teacherId]
    );
    
    console.log(`💬 [commentModel] ${publicQuestionComments.length} comentários em questões públicas encontrados`);
    
    for (const commentRow of publicQuestionComments) {
      // Evitar duplicatas (se o comentário já foi incluído por ser de aluno vinculado)
      if (!commentIdsSet.has(commentRow.id)) {
        commentIdsSet.add(commentRow.id);
        
        // Buscar respostas
        let responses = [];
        try {
          const [responseRows] = await pool.execute(
            'SELECT * FROM comments_responses WHERE comment_id = ? ORDER BY created_at ASC',
            [commentRow.id]
          );
            
          responses = responseRows.map(r => ({
            id: r.id,
            comment_id: r.comment_id,
            user_id: r.user_id,
            user_name: r.user_name,
            user_type: r.user_type,
            message: r.message,
            created_at: r.created_at ? r.created_at.toISOString() : null
          }));
        } catch (error) {
          console.warn(`⚠️ [commentModel] Erro ao buscar respostas: ${error.message}`);
        }
        
        comments.push({
          id: commentRow.id,
          question_id: commentRow.question_id,
          question_theme: commentRow.question_theme,
          question_text: commentRow.question_text,
          user_id: commentRow.user_id,
          user_name: commentRow.user_name,
          user_type: commentRow.user_type,
          message: commentRow.message,
          created_at: commentRow.created_at ? commentRow.created_at.toISOString() : null,
          responses
        });
      }
    }
    
    // Ordenar todos os comentários por data de criação (mais recentes primeiro)
    comments.sort((a, b) => {
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      return dateB - dateA;
    });
    
    console.log(`✅ [commentModel] Total de ${comments.length} comentários retornados`);
    return comments;
    
  } catch (error) {
    console.error(`❌ [commentModel] Erro ao buscar comentários: ${error.message}`);
    throw error;
  }
};

const getStudentComments = async (studentId) => {
  try {
    const pool = getPool();
    
    const [commentRows] = await pool.execute(
      'SELECT * FROM comments WHERE user_id = ? ORDER BY created_at ASC',
      [studentId]
    );
    
        const comments = [];
    
    for (const commentRow of commentRows) {
      const [responseRows] = await pool.execute(
        'SELECT * FROM comments_responses WHERE comment_id = ? ORDER BY created_at ASC',
        [commentRow.id]
      );
            
      const responses = responseRows.map(r => ({
                    id: r.id,
        commentId: r.comment_id,
        userId: r.user_id,
        userName: r.user_name,
        userType: r.user_type,
        message: r.message,
        createdAt: r.created_at ? r.created_at.toISOString() : null
                }));
      
                comments.push({
        id: commentRow.id,
        questionId: commentRow.question_id,
        questionTheme: commentRow.question_theme,
        questionText: commentRow.question_text,
        userId: commentRow.user_id,
        userName: commentRow.user_name,
        userType: commentRow.user_type,
        message: commentRow.message,
        createdAt: commentRow.created_at ? commentRow.created_at.toISOString() : null,
                    responses
                });
        }
    
        return comments;
  } catch (error) {
        logger.error(`Erro ao listar comentários do aluno ${studentId}: ${error.message}`);
        throw error;
    }
};

const addCommentResponse = async (responseData) => {
  try {
    const pool = getPool();
    const responseId = uuidv4();
    
    await pool.execute(
      `INSERT INTO comments_responses (id, comment_id, user_id, user_name, user_type, message, created_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        responseId,
        responseData.comment_id,
        responseData.user_id,
        responseData.user_name,
        responseData.user_type,
        responseData.message,
        new Date()
      ]
    );
    
    return responseId;
  } catch (error) {
        logger.error(`Erro ao adicionar resposta ao comentário: ${error.message}`);
        throw error;
    }
};

module.exports = { addComment, getTeacherComments, getStudentComments, addCommentResponse };
