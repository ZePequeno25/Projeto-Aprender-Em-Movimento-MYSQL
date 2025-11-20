const { getPool } = require('../utils/database');
const logger = require('../utils/logger');
const { getUserName } = require('./userModel');

const createTeacherStudent = async (teacherId, studentId, studentName) => {
  try {
    const pool = getPool();
        const relationId = `${studentId}_${teacherId}`;
        const teacherName = await getUserName(teacherId);
    
    await pool.execute(
      `INSERT INTO teacher_students (id, teacher_id, student_id, teacher_name, student_name, joined_at) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [relationId, teacherId, studentId, teacherName, studentName, new Date()]
    );
    
    return {
      relationId,
            teacher_id: teacherId,
            student_id: studentId,
            teacher_name: teacherName,
            student_name: studentName,
      joined_at: new Date()
        };
  } catch (error) {
        logger.error(`Erro ao criar Vinculação ${studentId}_${teacherId}: ${error.message}`);
        throw error;
    }
};

const getTeacherStudents = async (teacherId) => {
  try {
    const pool = getPool();
    const [rows] = await pool.execute(
      'SELECT * FROM teacher_students WHERE teacher_id = ? ORDER BY joined_at DESC',
      [teacherId]
    );
    
    return rows.map(row => ({
      relationId: row.id,
      teacher_id: row.teacher_id,
      student_id: row.student_id,
      teacher_name: row.teacher_name,
      student_name: row.student_name,
      createdAt: row.joined_at ? row.joined_at.toISOString() : null,
      joined_at: row.joined_at ? row.joined_at.toISOString() : null
        }));
  } catch (error) {
        logger.error(`Erro ao listar alunos do professor ${teacherId}: ${error.message}`);
        throw error;
    }
};

const getStudentRelations = async (studentId) => {
  try {
    const pool = getPool();
    const [rows] = await pool.execute(
      'SELECT * FROM teacher_students WHERE student_id = ? ORDER BY joined_at DESC',
      [studentId]
    );
    
    return rows.map(row => ({
      relationId: row.id,
      teacher_id: row.teacher_id,
      student_id: row.student_id,
      teacher_name: row.teacher_name,
      student_name: row.student_name,
      createdAt: row.joined_at ? row.joined_at.toISOString() : null,
      joined_at: row.joined_at ? row.joined_at.toISOString() : null
        }));
  } catch (error) {
        logger.error(`Erro ao listar professores do aluno ${studentId}: ${error.message}`);
        throw error;
    }
};

const deleteTeacherStudent = async (relationId) => {
  try {
    const pool = getPool();
    await pool.execute('DELETE FROM teacher_students WHERE id = ?', [relationId]);
  } catch (error) {
        logger.error(`Erro ao deletar vinculação ${relationId}: ${error.message}`);
        throw error;
    }
};

module.exports = { createTeacherStudent, getTeacherStudents, getStudentRelations, deleteTeacherStudent };
