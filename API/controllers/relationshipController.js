//Importa o pool de conexões MySQL
const { getPool } = require('../utils/database');
//Importa o token de autenticação
const { verifyToken } = require('../utils/jwt');
//Importa o logger
const logger = require('../utils/logger');

//Importa o modelo de usuário que contém as funções de verificação de professor e aluno
const {isProfessor, isStudent, getUserName} = require('../models/userModel');
//Importa o modelo de código de professor que contém as funções de criação de código de professor, obtenção de código de professor e uso de código de professor
const {createTeacherCode, getTeacherCode, useTeacherCode} = require('../models/teacherCodeModel');
//Importa o modelo de relação de professor e aluno que contém as funções de criação de relação de professor e aluno, obtenção de relações de professor e aluno e exclusão de relação de professor e aluno
const {createTeacherStudent, getTeacherStudents, getStudentRelations, deleteTeacherStudent} = require('../models/teacherStudentModel');
//Importa a função de verificação de ID válido

//Função de verificação de ID válido
const isValidId = (id, paramName) => {
    //Verifica se o ID é inválido
    if(!id || id === 'undefined' || typeof id !== 'string' || id.trim().length === 0){
        //Loga o ID inválido
        logger.warn(`ID inválido para ${paramName}: ${id}`);
        //Retorna false
        return false;
    }
    //Retorna true
    return true;
};

//Função de obtenção de dados dos alunos
const getStudentsHandler = async (req, res) => {
  //Loga o início da obtenção de dados dos alunos
  try {
    //Loga o início da obtenção de dados dos alunos
    logger.info('👥 [relationshipController] Buscando dados dos alunos...', 'RELATIONSHIPS');
    
    //Obtém o ID do usuário atual
    const userId = await getCurrentUserId(req);
    //Loga o usuário autenticado
    logger.info(`🔍 [relationshipController] Usuário autenticado: ${userId}`, 'RELATIONSHIPS');
    
    //Verifica se o usuário é professor
    const pool = getPool();
    const [userRows] = await pool.execute(
      'SELECT * FROM users WHERE id = ?',
      [userId]
    );
    
    if (userRows.length === 0) {
      //Loga o usuário não encontrado
      logger.warn(`❌ [relationshipController] Usuário não encontrado: ${userId}`, 'RELATIONSHIPS');
      //Retorna erro de usuário não encontrado
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }
    
    const userData = userRows[0];
    if (userData.userType !== 'professor') {
      //Loga o usuário não é professor
      logger.warn(`❌ [relationshipController] Usuário ${userId} não é professor`, 'RELATIONSHIPS');
      //Retorna erro de usuário não é professor
      return res.status(403).json({ error: 'Apenas professores podem acessar dados dos alunos' });
    }

    //Busca alunos vinculados ao professor
    const [relationRows] = await pool.execute(
      'SELECT * FROM teacher_students WHERE teacher_id = ?',
      [userId]
    );
    
    //Loga o número de relações encontradas
    logger.info(`📊 [relationshipController] ${relationRows.length} relações encontradas`, 'RELATIONSHIPS');
    
    const students = [];
    //Loga o número de alunos encontrados
    logger.info(`📊 [relationshipController] ${students.length} alunos encontrados`, 'RELATIONSHIPS');
    
    for (const relationData of relationRows) {
      const studentId = relationData.student_id;
      //Loga o ID do aluno
      logger.info(`📊 [relationshipController] ID do aluno: ${studentId}`, 'RELATIONSHIPS');
      
      try {
        //Busca aluno
        const [studentRows] = await pool.execute(
          'SELECT * FROM users WHERE id = ?',
          [studentId]
        );
        
        //Verifica se o aluno foi encontrado
        if (studentRows.length > 0) {
          //Loga o aluno encontrado
          logger.info(`✅ [relationshipController] Aluno encontrado: ${studentId}`, 'RELATIONSHIPS');
          //Obtém os dados do aluno
          const studentData = studentRows[0];
          //Adiciona os dados do aluno ao array de alunos
          students.push({
            //Loga o ID do aluno
            id: studentId,
            //Loga o nome completo do aluno
            nomeCompleto: studentData.nomeCompleto,
            //Loga o email do aluno
            email: studentData.email,
            //Loga o tipo de usuário do aluno
            userType: studentData.userType,
            //Loga a pontuação do aluno
            score: studentData.score || 0,
            //Loga o rank do aluno
            rank: studentData.rank || 'Iniciante',
            //Loga o CPF do aluno
            cpf: studentData.cpf,
            //Loga a data de nascimento do aluno
            dataNascimento: studentData.dataNascimento,
            //Loga o ID da relação
            relationId: relationData.id,
            //Loga a data de vinculação da relação
            joined_at: relationData.joined_at ? relationData.joined_at.toISOString() : null,
            //Loga o nome do aluno
            student_name: relationData.student_name,
            //Loga o nome do professor
            teacher_name: relationData.teacher_name
          });
        } else {
          //Loga o aluno não encontrado
          logger.warn(`⚠️ [relationshipController] Aluno não encontrado: ${studentId}`, 'RELATIONSHIPS');
        }
      } catch (error) {
        //Loga o erro ao buscar aluno
        logger.warn(`⚠️ [relationshipController] Erro ao buscar aluno ${studentId}: ${error.message}`, 'RELATIONSHIPS');
      }
    }

    //Loga o número de alunos retornados
    logger.info(`✅ [relationshipController] ${students.length} alunos retornados`, 'RELATIONSHIPS');
    res.status(200).json(students);
    
  } catch (error) {
    //Loga o erro ao buscar alunos
    logger.error(`❌ [relationshipController] Erro ao buscar alunos: ${error.message}`, 'RELATIONSHIPS');
    //Retorna erro interno
    res.status(500).json({ error: error.message });
  }
};

const getCurrentUserId = async (req) => {
    //Obtém o token da requisição
    const token = req.headers.authorization?.replace('Bearer ', '');
    //Verifica se o token está ausente
    if(!token) {
      //Loga o token ausente
      logger.warn('❌ [relationshipController] Token ausente', 'RELATIONSHIPS');
      //Retorna erro de token ausente
      throw new Error('Authentication token unavailable');
    }
    //Verifica se o token é válido
    const decodedToken = await verifyToken(token);
    //Loga o token decodificado
    logger.info(`🔍 [relationshipController] Token decodificado: ${decodedToken}`, 'RELATIONSHIPS');
    //Retorna o ID do usuário
    return decodedToken.uid || decodedToken.userId;
};
//Função de geração de código de professor
const generateTeacherCode = async (req, res) => {
    //Loga o início da geração de código de professor
    logger.info('🔑 [relationshipController] Iniciando geração de código de professor', 'RELATIONSHIPS');
    
    try{
        //Obtém o ID do usuário atual
        const userId = await getCurrentUserId(req);
        //Loga o usuário autenticado
        logger.info(`👤 [relationshipController] Usuário autenticado: ${userId}`, 'RELATIONSHIPS');
        //Verifica se o usuário é professor
        if(!await isProfessor(userId)){
            //Loga o erro de usuário não é professor
            logger.warn(`❌ [relationshipController] Usuário ${userId} não é professor`, 'RELATIONSHIPS');
            //Retorna erro de usuário não é professor
            return res.status(403).json({error: 'Only teachers can generate codes'});
        }
        
        // Gerar código único: PROF_ + 8 primeiros chars do userId + timestamp (últimos 4 chars do timestamp)
        const timestamp = Date.now().toString();
        //Obtém o sufixo único
        const uniqueSuffix = timestamp.slice(-4).toUpperCase();
        //Gera o código de professor
        const linkCode = `PROF_${userId.slice(0, 6).toUpperCase()}${uniqueSuffix}`;
        //Cria o código de professor
        await createTeacherCode(userId, linkCode);
        //Loga o código de professor gerado
        logger.info(`✅ [relationshipController] Código gerado: ${linkCode}`, 'RELATIONSHIPS');
        //Retorna o código de professor gerado
        res.status(200).json({ linkCode, message: 'Teacher code generated successfully' });
        
    }catch (error){
        //Loga o erro ao gerar código
        logger.error(`Erro ao gerar código`, error, 'RELATIONSHIPS');
        //Retorna erro interno
        res.status(500).json({ error: error.message });
    }
};

//Função de obtenção de código de professor
const getTeacherCodeHandler = async (req, res) => {
    //Loga o início da obtenção de código de professor
    logger.info('📋 [relationshipController] Buscando código do professor', 'RELATIONSHIPS');
    
    try {
        //Obtém o ID do professor
        const { teacherId } = req.params;
        //Loga o ID do professor
        logger.info(`📊 [relationshipController] teacherId: ${teacherId}`, 'RELATIONSHIPS');
        
        //Verifica se o ID do professor é válido
        if(!isValidId(teacherId, 'teacherId')){
            //Loga o erro de ID do professor inválido
            logger.warn(`❌ [relationshipController] teacherId inválido`, 'RELATIONSHIPS');
            return res.status(400).json({ error: 'Invalid teacherId' });
        }
        //Obtém o ID do usuário atual
        const userId = await getCurrentUserId(req);
        //Verifica se o usuário é professor
        if(userId !== teacherId || !await isProfessor(userId)){
            //Loga o erro de acesso negado
            logger.warn(`❌ [relationshipController] Acesso negado para ${userId}`, 'RELATIONSHIPS');
            return res.status(403).json({ error: 'Access denied' });
        }
        //Obtém o código de professor
        const codeData = await getTeacherCode(teacherId);
        //Obtém o código de professor
        const linkCode = codeData ? codeData.code : `PROF_${userId.slice(0, 8).toUpperCase()}`;
        //Loga o código de professor encontrado
        logger.info(`✅ [relationshipController] Código encontrado: ${linkCode}`, 'RELATIONSHIPS');
        //Retorna o código de professor encontrado
        res.status(200).json({ linkCode });

    }catch (error){
        //Loga o erro ao carregar código
        logger.error(`Erro ao carregar código`, error, 'RELATIONSHIPS');
        //Retorna erro interno
        res.status(500).json({ error: error.message });
    }
};

//Função de vinculação de aluno por código
const linkStudentByCode = async (req, res) => {
    //Loga o início da vinculação de aluno
    logger.info('🔗 [relationshipController] Iniciando vinculação de aluno', 'RELATIONSHIPS');
    
    try {
        //Obtém o ID do usuário atual
        const userId = await getCurrentUserId(req);
        //Loga o usuário autenticado
        logger.info(`👤 [relationshipController] Usuário autenticado: ${userId}`, 'RELATIONSHIPS');
        
        //Verifica se o usuário é aluno
        if(!await isStudent(userId)){
            //Loga o erro de usuário não é aluno
            logger.warn(`❌ [relationshipController] Usuário ${userId} não é aluno`, 'RELATIONSHIPS');
            return res.status(403).json({ error: 'Only students can link to teachers' });
        }
        //Obtém os dados da requisição
        const{teacherCode, studentId, studentName} = req.body;
        //Loga os dados
        logger.info(`📊 [relationshipController] Dados: code=${teacherCode}, studentName=${studentName}`, 'RELATIONSHIPS');
        
        //Verifica se os dados são válidos
        if(!teacherCode || studentId !== userId || !isValidId(studentId, 'studentId')){
            //Loga o erro de dados inválidos
            logger.warn(`❌ [relationshipController] Dados inválidos`, 'RELATIONSHIPS');
            return res.status(400).json({ error: 'Invalid teacherCode or studentId' });
        }
        //Obtém o código de professor
        const codeData = await useTeacherCode(teacherCode, userId);
        //Verifica se o código de professor é válido
        if(!codeData){
            //Loga o erro de código inválido ou expirado
            logger.warn(`❌ [relationshipController] Código inválido ou expirado: ${teacherCode}`, 'RELATIONSHIPS');
            return res.status(400).json({ error: 'Invalid or expired code' });
        }
        //Obtém o ID do professor
        const teacherId = codeData.teacher_id;
        //Obtém o ID da relação
        const relationId = `${studentId}_${teacherId}`;
        
        const pool = getPool();
        //Obtém a relação existente
        const [existing] = await pool.execute(
          'SELECT * FROM teacher_students WHERE id = ?',
          [relationId]
        );
        
        //Verifica se a relação existe
        if(existing.length > 0){
            //Loga o erro de relação já existe
            logger.warn(`❌ [relationshipController] Relação já existe: ${relationId}`, 'RELATIONSHIPS');
            return res.status(400).json({ error: 'You are already linked to this teacher' });
        }
        //Cria a relação
        const linkData = await createTeacherStudent(teacherId, studentId, studentName);
        //Loga o aluno vinculado ao professor
        logger.info(`✅ [relationshipController] Aluno ${userId} vinculado ao professor ${teacherId}`, 'RELATIONSHIPS');
        res.status(200).json({ success: true, teacherName: linkData.teacher_name, relationId});

    }catch (error){
        //Loga o erro ao vincular aluno
        logger.error(`Erro ao vincular aluno`, error, 'RELATIONSHIPS');
        //Retorna erro interno
        res.status(500).json({ error: error.message });
    }
};

//Função de obtenção de alunos vinculados ao professor
const getTeacherStudentsHandler = async (req, res) => {
    //Loga o início da obtenção de alunos vinculados ao professor
    try {
        //Obtém o ID do usuário atual
        const userId = await getCurrentUserId(req);
        //Loga o ID do usuário atual
        console.log(`🔍 [relationshipController] Buscando alunos para teacherId: ${userId}`);
        
        //Verifica se o usuário é professor
        if (!await isProfessor(userId)) {
            //Loga o erro de acesso negado
        return res.status(403).json({ error: 'Only teachers can access student data' });
        }

        //Obtém as relações
        const relations = await getTeacherStudents(userId);
        //Retorna as relações
        res.status(200).json(relations || []);

    } catch (error) {
        //Loga o erro ao listar alunos
        logger.error(`Erro ao listar alunos: ${error.message}`, 'RELATIONSHIPS');
        //Retorna erro interno
        res.status(error.message.includes('Token') ? 401 : 500).json({ error: error.message });
    }
};

//Função de obtenção de relações de aluno
const getStudentRelationsHandler = async (req, res) => {
    //Loga o início da obtenção de relações de aluno
    try{
        //Obtém o ID do aluno
        const {studentId} = req.params;
        //Verifica se o ID do aluno é válido
        if(!isValidId(studentId, 'studentId')){
            return res.status(400).json({ error: 'Invalid studentId' });
        }
        //Obtém o ID do usuário atual
        const userId = await getCurrentUserId(req);
        //Verifica se o usuário é aluno
        if(userId !== studentId || !await isStudent(userId)){
            return res.status(403).json({ error: 'Access denied' });
        }
        //Obtém as relações
        const relations = await getStudentRelations(studentId);
        //Retorna as relações
        res.status(200).json(relations || []);

    }catch (error){
        //Loga o erro ao listar professores
        logger.error(`Erro ao listar professores: ${error.message}`, 'RELATIONSHIPS');
        //Retorna erro interno
        res.status(500).json({ error: error.message });
    }
};

//Função de desvinculação de aluno
const unlinkStudent = async (req, res) => {
    //Loga o início da desvinculação
    logger.info('🔓 [relationshipController] Iniciando desvinculação', 'RELATIONSHIPS');
    
    try{
        //Obtém o ID da relação
        const {relationId} = req.params;
        //Loga o ID da relação
        logger.info(`📊 [relationshipController] relationId: ${relationId}`, 'RELATIONSHIPS');
        
        //Verifica se o ID da relação é válido
        if(!isValidId(relationId, 'relationId')){
            //Loga o erro de ID da relação inválido
            logger.warn(`❌ [relationshipController] relationId inválido`, 'RELATIONSHIPS');
            return res.status(400).json({ error: 'Invalid relationId' });
        }
        //Obtém o ID do usuário atual
        const userId = await getCurrentUserId(req);
        //Obtém a relação existente
        const pool = getPool();
        const [relationRows] = await pool.execute(
          'SELECT * FROM teacher_students WHERE id = ?',
          [relationId]
        );
        
        //Verifica se a relação existe
        if(relationRows.length === 0){
            //Loga o erro de relação não encontrada
            logger.warn(`❌ [relationshipController] Relação não encontrada: ${relationId}`, 'RELATIONSHIPS');
            return res.status(404).json({ error: 'Relation not found' });
        }
        //Obtém os dados da relação
        const relationData = relationRows[0];
        //Verifica se o usuário tem permissão
        if(relationData.teacher_id !== userId && relationData.student_id !== userId){
            logger.warn(`❌ [relationshipController] Usuário ${userId} sem permissão`, 'RELATIONSHIPS');
            return res.status(403).json({ error: 'Only participants can unlink' });
        }
        //Desvincula o aluno
        await deleteTeacherStudent(relationId);
        //Loga a relação desvinculada
        logger.info(`✅ [relationshipController] Relação desvinculada: ${relationId}`, 'RELATIONSHIPS');
        res.status(200).json({ success: true, message: 'Unlinked successfully' });

    }catch (error){
        //Loga o erro ao desvincular
        logger.error(`Erro ao desvincular`, error, 'RELATIONSHIPS');
        //Retorna erro interno
        res.status(500).json({ error: error.message });
    }
};

//Exporta os controllers
module.exports = {
    //Função de geração de código de professor
    generateTeacherCode,
    getTeacherCodeHandler,
    linkStudentByCode,
    getTeacherStudentsHandler,
    getStudentRelationsHandler,
    unlinkStudent,
    getStudentsHandler
  };
