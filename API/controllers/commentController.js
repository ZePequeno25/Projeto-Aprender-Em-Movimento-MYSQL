//Importa o logger
const logger = require('../utils/logger');
//Importa o modelo de usuário que contém as funções de verificação de professor e aluno
const { isProfessor, isStudent } = require('../models/userModel');
//Importa o modelo de comentário que contém as funções de adição de comentário, obtenção de comentários de professor, obtenção de comentários de aluno e adição de resposta de comentário
const { addComment, getTeacherComments, getStudentComments, addCommentResponse } = require('../models/commentModel');
//Importa o pool de conexões MySQL
const { getPool } = require('../utils/database');

//Função de obtenção do ID do usuário atual
const getCurrentUserId = async (req) => {
    
    //Verifica se o usuário está autenticado
    if (!req.userId) {
        //Log do erro
        throw new Error('Usuário não autenticado - middleware não aplicado');
    }
    //Retorna o ID do usuário
    return req.userId;
};

//Função de verificação de ID válido
const isValidId = (id, paramName) => {
    //Verifica se o ID é válido
    if (!id || id === 'undefined' || typeof id !== 'string' || id.trim().length === 0) {
        //Log do ID inválido
        logger.warn(`ID inválido para ${paramName}: ${id}`);
        //Retorna false
        return false;
    }
    //Retorna true
    return true;
};

//Função de adição de comentário
const addCommentHandler = async (req, res) => {
    //Log do início da adição de comentário
    logger.info('💭 [commentController] Iniciando adição de comentário', 'COMMENTS');
    
    try{
        //Obtém o ID do usuário atual
        const userId = await getCurrentUserId(req);
        //Log do usuário autenticado
        logger.info(`👤 [commentController] Usuário autenticado: ${userId}`, 'COMMENTS');
        
        //Obtém os dados do comentário
        const {questionId, questionTheme, questionText, userName, userType, message} = req.body;
        //Log dos dados do comentário
        logger.info(`📊 [commentController] Dados: questionId=${questionId}, theme=${questionTheme}, userName=${userName}`, 'COMMENTS');
        
        if(!questionId || !questionTheme || !questionText || !userName || !userType || !message){ 
            //Log dos campos obrigatórios faltando
            logger.warn('❌ [commentController] Campos obrigatórios faltando', 'COMMENTS');
            //Retorna erro de campos obrigatórios faltando
            return res.status(400).json({error: 'Campos obrigatórios ausentes'});
        }
        if(!['aluno', 'professor'].includes(userType)){
            //Log do userType inválido
            logger.warn(`❌ [commentController] userType inválido: ${userType}`, 'COMMENTS');
            //Retorna erro de tipo de usuário inválido
            return res.status(400).json({error: 'Tipo de usuário inválido'});
        }
        //Obtém os dados do comentário
        const commentData = {
            //Log do ID da questão
            question_id: questionId,
            //Log do tema da questão
            question_theme: questionTheme,
            //Log do texto da questão
            question_text: questionText,
            user_id: userId,
            //Log do nome do usuário
            user_name: userName,
            //Log do tipo de usuário
            user_type: userType,
            //Log da mensagem
            message
        };
        //Adiciona o comentário
        const commentId = await addComment(commentData);
        //Log do comentário adicionado
        logger.info(`✅ [commentController] Comentário adicionado: ${commentId}`, 'COMMENTS');
        //Retorna o comentário adicionado
        res.status(201).json({message: 'Comentário adicionado com sucesso', id: commentId});

    }catch (error){
        //Log do erro
        logger.error(`Erro ao adicionar comentário`, error, 'COMMENTS');
        //Retorna erro interno
        res.status(500).json({error: error.message});
    }
};

//Função de obtenção de comentários de professor
const getTeacherCommentsHandler = async (req, res) => {
    //Log do início da obtenção de comentários de professor
    logger.info('📋 [commentController] Buscando comentários de professor', 'COMMENTS');
    
    try{
        //Obtém o teacherId
        const {teacherId} = req.params;
        //Verifica se o teacherId é válido
        if(!isValidId(teacherId, 'teacherId')){
            //Log do teacherId inválido
            logger.warn(`❌ [commentController] teacherId inválido: ${teacherId}`, 'COMMENTS');
            //Retorna erro de teacherId inválido
            return res.status(400).json({error: 'TeacherId inválido'});
        }
        //Obtém o ID do usuário atual
        const userId = await getCurrentUserId(req);
        //Verifica se o usuário é o professor
        if(userId !== teacherId || !await isProfessor(userId)){
            //Log do que o usuário não tem permissão
            logger.warn(`❌ [commentController] Acesso negado para ${userId}`, 'COMMENTS');
            //Retorna erro de acesso negado
            return res.status(403).json({error: 'Acesso negado'});
        }
        //Obtém os comentários
        const comments = await getTeacherComments(teacherId);
        //Log do número de comentários encontrados
        logger.info(`✅ [commentController] ${comments.length} comentários encontrados`, 'COMMENTS');
        //Retorna os comentários
        res.status(200).json({comments});
    }catch (error){
        //Log do erro
        logger.error(`Erro ao listar comentários do professor ${teacherId}: ${error.message}`, 'COMMENTS');
        //Retorna erro interno
        res.status(500).json({error: error.message});
    }
};

//Função de obtenção de comentários de aluno
const getStudentCommentsHandler = async (req, res) => {
    //Log do início da obtenção de comentários de aluno
    logger.info('📋 [commentController] Buscando comentários de aluno', 'COMMENTS');
    
    try{
        //Obtém o studentId
        const {studentId} = req.params;
        //Verifica se o studentId é válido
        if(!isValidId(studentId, 'studentId')){
            //Log do studentId inválido
            logger.warn(`❌ [commentController] studentId inválido: ${studentId}`, 'COMMENTS');
            //Retorna erro de studentId inválido
            return res.status(400).json({error: 'StudentId inválido'});
        }
        //Obtém o ID do usuário atual
        const userId = await getCurrentUserId(req);
        //Verifica se o usuário é o aluno
        if(userId !== studentId || !await isStudent(userId)){
            //Log do que o usuário não tem permissão
            logger.warn(`❌ [commentController] Acesso negado para ${userId}`, 'COMMENTS');
            //Retorna erro de acesso negado
            return res.status(403).json({error: 'Acesso negado'});
        }
        //Obtém os comentários
        const comments = await getStudentComments(studentId);
        //Log do número de comentários encontrados
        logger.info(`✅ [commentController] ${comments.length} comentários encontrados`, 'COMMENTS');
        //Retorna os comentários
        res.status(200).json({comments});
    }catch (error){
        //Log do erro
        logger.error(`Erro ao listar comentários do aluno ${studentId}: ${error.message}`, 'COMMENTS');
        //Retorna erro interno
        res.status(500).json({error: error.message});
    }
};

//Função de adição de resposta de comentário
const addCommentResponseHandler = async (req, res) => {
    //Log do início da adição de resposta de comentário
    logger.info('📋 [commentController] Iniciando adição de resposta de comentário', 'COMMENTS');
    
    try{
        //Obtém o ID do usuário atual
        const userId = await getCurrentUserId(req);
        //Log do usuário autenticado
        logger.info(`👤 [commentController] Usuário autenticado: ${userId}`, 'COMMENTS');
        
        //Obtém os dados da resposta
        const {commentId, userName, userType, message} = req.body;
        //Log dos dados da resposta
        logger.info(`📊 [commentController] Dados: commentId=${commentId}, userName=${userName}, userType=${userType}`, 'COMMENTS');
        
        //Verifica se os campos obrigatórios estão presentes
        if(!commentId || !userName || !userType || !message){
            //Log dos campos obrigatórios faltando
            logger.warn('❌ [commentController] Campos obrigatórios faltando', 'COMMENTS');
            //Retorna erro de campos obrigatórios faltando
            return res.status(400).json({error: 'Campos obrigatórios ausentes'});
        }
        if(!['aluno', 'professor'].includes(userType)){
            //Log do userType inválido
            logger.warn(`❌ [commentController] userType inválido: ${userType}`, 'COMMENTS');
            //Retorna erro de tipo de usuário inválido
            return res.status(400).json({error: 'Tipo de usuário inválido'});
        }
        
        //Obtém o pool de conexões MySQL
        const pool = getPool();
        //Obtém os comentários
        const [commentRows] = await pool.execute(
            'SELECT * FROM comments WHERE id = ?',
            [commentId]
        );
        //Verifica se o comentário existe
        if(commentRows.length === 0){
            //Log do que o comentário não foi encontrado
            logger.warn(`❌ [commentController] Comentário não encontrado: ${commentId}`, 'COMMENTS');
            //Retorna erro de comentário não encontrado
            return res.status(404).json({error: 'Comentário não encontrado'});
        }
        
        //Obtém os dados da resposta
        const responseData = {
            //Log do ID do comentário
            comment_id: commentId,
            //Log do ID do usuário
            user_id: userId,
            //Log do nome do usuário
            user_name: userName,
            //Log do tipo de usuário
            user_type: userType,
            //Log da mensagem
            message
        };
        //Adiciona a resposta
        const responseId = await addCommentResponse(responseData);
        //Log da resposta adicionada
        logger.info(`Resposta adicionada por ${userId} com ID: ${responseId} ao comentário: ${commentId}`, 'COMMENTS');
        //Retorna a resposta adicionada
        res.status(201).json({message: 'Resposta adicionada com sucesso', id: responseId});

    }catch (error){
        //Log do erro
        logger.error(`Erro ao adicionar resposta ao comentário: ${error.message}`, 'COMMENTS');
        //Retorna erro interno
        res.status(500).json({error: error.message});
    }
};

//Exporta os controllers
module.exports = {
    //Função de adição de comentário
    addCommentHandler,
    //Função de obtenção de comentários de professor
    getTeacherCommentsHandler,
    //Função de obtenção de comentários de aluno
    getStudentCommentsHandler,
    //Função de adição de resposta de comentário
    addCommentResponseHandler
};
