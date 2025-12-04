//Importa o logger
const logger = require('../utils/logger');
//Importa o modelo de usuário que contém as funções de verificação de professor e aluno
const { isProfessor, isStudent } = require('../models/userModel');
//Importa o modelo de questão que contém as funções de adição de questão, obtenção de questões, atualização de questão e deletar questão
const { addQuestion, getQuestions, updateQuestion, deleteQuestion } = require('../models/questionModel');
//Importa o modelo de relação de professor e aluno que contém as funções de obtenção de relações de professor e aluno
const { getStudentRelations } = require('../models/teacherStudentModel');

//Função de adição de questão
const addQuestionHandler = async (req, res) => {
  //Log do início da adição de questão
  logger.info('💭 [questionController] Iniciando adição de questão', 'QUESTIONS');
  
  try {
    //Obtém o ID do usuário atual
    const userId = req.userId;
    //Log do usuário autenticado
    logger.info(`👤 [questionController] Usuário autenticado: ${userId}`, 'QUESTIONS');
    
    if (!userId) {
      //Log do erro
      logger.warn('❌ [questionController] Usuário não autenticado', 'QUESTIONS');
      //Retorna erro de usuário não autenticado
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    if (!await isProfessor(userId)) {
      //Log do erro
      logger.warn(`❌ [questionController] Usuário ${userId} não é professor`, 'QUESTIONS');
      //Retorna erro de usuário não é professor
      return res.status(403).json({ error: 'Only teachers can add questions' });
    }
    //Obtém os dados da questão
    const { theme, question, options, correctOptionIndex, feedback, visibility } = req.body;
    //Log dos dados da questão
    logger.info(`📊 [questionController] Dados: theme=${theme}, question=${question}, options=${options}, correctOptionIndex=${correctOptionIndex}, feedback=${feedback}, visibility=${visibility}`, 'QUESTIONS');
    
    //Verifica se os campos obrigatórios estão presentes
    if (!theme || !question || !options || !Array.isArray(options) || correctOptionIndex === undefined || !feedback || !feedback.title || !feedback.text) {
      //Log dos campos obrigatórios faltando
      logger.warn('❌ [questionController] Campos obrigatórios faltando', 'QUESTIONS');
      //Retorna erro de campos obrigatórios faltando
      return res.status(400).json({ error: 'Missing required fields: theme, question, options, correctOptionIndex, feedback.title, feedback.text' });
    }
    //Obtém os dados da questão
    const questionData = {
      //Log do tema da questão
      theme: theme.toLowerCase().trim(),
      question_text: question,
      //Log das opções da questão
      options_json: options,
      //Log do índice da opção correta
      correct_option_index: parseInt(correctOptionIndex),
      //Log do título do feedback
      feedback_title: feedback.title || '',
      //Log da ilustração do feedback
      feedback_illustration: feedback.illustration || '',
      //Log do texto do feedback
      feedback_text: feedback.text || '',
      //Log do ID do usuário que criou a questão
      created_by: userId,
      //Log da visibilidade da questão
      visibility: visibility || 'public'
    };
    //Adiciona a questão
    const questionId = await addQuestion(questionData);
    //Log da questão adicionada
    logger.info(`✅ [questionController] Questão adicionada: ${questionId}`, 'QUESTIONS');
    //Retorna a questão adicionada
    res.status(201).json({ message: 'Questão adicionada com sucesso', id: questionId });
  } catch (error) {
    //Log do erro
    logger.error(`Erro ao adicionar questão: ${error.message}`, 'QUESTIONS');
    //Retorna erro interno
    res.status(error.message.includes('Token') ? 401 : 500).json({ error: error.message });
  }
};

//Função de obtenção de questões
const getQuestionsHandler = async (req, res) => {
  //Log do início da obtenção de questões
  logger.info('📚 [questionController] Buscando todas as questões...', 'QUESTIONS');
  
  try {
    //Obtém o ID do usuário atual
    const userId = req.userId;
    //Log do usuário autenticado
    logger.info(`👤 [questionController] Usuário autenticado: ${userId}`, 'QUESTIONS');
    
    //Verifica se o usuário é professor
    const userIsProfessor = await isProfessor(userId);
    //Verifica se o usuário é aluno
    const userIsStudent = await isStudent(userId);

    let questions = [];
    //Obtém os IDs dos professores vinculados ao aluno
    let linkedTeacherIds = [];

    // Se for aluno, buscar professores vinculados para incluir questões privadas
    if (userIsStudent) {
      try {
        //Obtém as relações do aluno
        const relations = await getStudentRelations(userId);
        //Log do número de professores vinculados ao aluno
        linkedTeacherIds = relations.map(r => r.teacher_id);
        //Log do número de professores vinculados ao aluno
        logger.info(`📊 [questionController] Aluno ${userId} vinculado a ${linkedTeacherIds.length} professores`, 'QUESTIONS');
      } catch (err) {
        //Log do erro
        logger.warn(`⚠️ [questionController] Erro ao buscar relações do aluno: ${err.message}`, 'QUESTIONS');
      }
      
      // Buscar questões públicas + privadas dos professores vinculados
      questions = await getQuestions('public', linkedTeacherIds);
      //Log do número de questões encontradas
      logger.info(`✅ [questionController] ${questions.length} questões encontradas`, 'QUESTIONS');
    } else if (userIsProfessor) {
      //Professores veem todas as questões
      questions = await getQuestions(null, []);
      //Log do número de questões encontradas
      logger.info(`✅ [questionController] ${questions.length} questões encontradas`, 'QUESTIONS');
    } else {
      // Usuário sem tipo definido, apenas públicas
      questions = await getQuestions('public', []);
      //Log do número de questões encontradas
      logger.info(`✅ [questionController] ${questions.length} questões encontradas`, 'QUESTIONS');
    }

    //Formata as questões para o frontend
    const formattedQuestions = questions.map(q => ({
      id: q.id,
      theme: q.theme,
      question: q.question_text, //Mapear para o nome que o frontend espera
      options: q.options_json,   //Já é um array
      correctOptionIndex: q.correct_option_index,
      feedback: {
        title: q.feedback_title,
        text: q.feedback_text,
        illustration: q.feedback_illustration
      },
      createdBy: q.created_by,
      visibility: q.visibility || 'private',
      createdAt: q.createdAt
    }));

    //Retorna as questões formatadas
    res.status(200).json(formattedQuestions);
  } catch (error) {
    //Log do erro
    logger.error(`❌ [questionController] Erro ao buscar perguntas: ${error.message}`, 'QUESTIONS');
    logger.error('Erro ao buscar perguntas', error, 'QUESTIONS');
    //Retorna erro interno
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

//Função de edição de questão
const editQuestionHandler = async (req, res) => {
  //Log do início da edição de questão
  logger.info('💭 [questionController] Iniciando edição de questão', 'QUESTIONS');
  
  try {
    const userId = req.userId;
        
    if(!userId) { 
      //Log do erro
      logger.warn('❌ [questionController] Usuário não autenticado', 'QUESTIONS');
      //Retorna erro de usuário não autenticado
      return res.status(401).json({error: 'Usuário não autenticado'});
    }
    const { questionId } = req.params;
    //Verifica se o usuário é professor
    if (!await isProfessor(userId)) {
      //Log do erro
      logger.warn(`❌ [questionController] Usuário ${userId} não é professor`, 'QUESTIONS');
      //Retorna erro de usuário não é professor
      return res.status(403).json({ error: 'Only teachers can edit questions' });
    }
    const { theme, question, options, correctOptionIndex, feedback, visibility } = req.body;
    //Verifica se os campos obrigatórios estão presentes
    if (!theme || !question || !options || !Array.isArray(options) || correctOptionIndex === undefined || !feedback || !feedback.title || !feedback.text) {
      //Log dos campos obrigatórios faltando
      logger.warn('❌ [questionController] Campos obrigatórios faltando', 'QUESTIONS');
      //Retorna erro de campos obrigatórios faltando
      return res.status(400).json({ error: 'Missing required fields' });
    }
    //Obtém os dados da questão
    const questionData = {
      //Log do tema da questão
      theme: theme.toLowerCase().trim(),
      question_text: question,
      //Logas opções da questão
      options_json: options,
      //Log do índice da opção correta
      correct_option_index: parseInt(correctOptionIndex),
      feedback_title: feedback.title || '',
      //Log da ilustração do feedback
      feedback_illustration: feedback.illustration || '',
      //Log do texto do feedback
      feedback_text: feedback.text || '',
      visibility: visibility || 'public'
    };
    //Atualiza a questão
    await updateQuestion(questionId, questionData);
    //Log da questão atualizada
    logger.info(`✅ [questionController] Questão atualizada: ${questionId}`, 'QUESTIONS');
    //Retorna a questão atualizada
    res.status(200).json({ message: 'Questão atualizada com sucesso', id: questionId });
  } catch (error) {
    //Log do erro
    logger.error(`Erro ao atualizar questão: ${error.message}`, 'QUESTIONS');
    //Retorna erro interno
    res.status(error.message.includes('Token') ? 401 : 500).json({ error: error.message });
  }
};

//Função de exclusão de questão
const deleteQuestionHandler = async (req, res) => {
  //Log do início da exclusão de questão
  logger.info('💭 [questionController] Iniciando exclusão de questão', 'QUESTIONS');
  
    try{
        const userId = req.userId;
        //Verifica se o usuário é professor
        if(!await isProfessor(userId)){
            //Log do erro
            logger.warn(`❌ [questionController] Usuário ${userId} não é professor`, 'QUESTIONS');
            //Retorna erro de usuário não é professor
            return res.status(403).json({error: 'Only teachers can delete questions'});
        };
        const {questionId} = req.params;
        //Exclui a questão
        await deleteQuestion(questionId);
        //Log da questão excluída
        logger.info(`Pergunta deletada: ${questionId} por ${userId}`, 'QUESTIONS');
        //Retorna a questão excluída
        res.status(200).json({message: 'Questão excluída com sucesso'});

    }catch(error){
        //Log do erro
        logger.error(`Erro ao deletar pergunta: ${error.message}`, 'QUESTIONS');
        //Retorna erro interno
        res.status(500).json({error: 'Erro interno do servidor'});
    }
};

//Função de alteração de visibilidade de questão
const updateQuestionVisibilityHandler = async (req, res) => {
    //Log do início da alteração de visibilidade de questão
    logger.info('🔄 [questionController] Iniciando alteração de visibilidade...', 'QUESTIONS');
    
    try {
        //Obtém o ID do usuário atual
        const userId = req.userId;
        //Log do usuário autenticado
        logger.info(`👤 [questionController] Usuário autenticado: ${userId}`, 'QUESTIONS');
        
        //Verifica se o usuário é professor
        const isUserProfessor = await isProfessor(userId);
        //Verifica se o usuário é professor
        if (!isUserProfessor) {
            //Log do erro
            logger.warn(`❌ [questionController] Usuário ${userId} não é professor`, 'QUESTIONS');
            //Retorna erro de usuário não é professor
            return res.status(403).json({ error: 'Apenas professores podem alterar visibilidade' });
        }

        //Obtém o ID da questão
        const { questionId } = req.params;
        //Obtém a visibilidade
        const { visibility } = req.body;

        //Log dos dados recebidos
        logger.info(`📊 [questionController] Dados recebidos: questionId=${questionId}, visibility=${visibility}`, 'QUESTIONS');

        if (!questionId || !visibility) {
            //Log dos campos obrigatórios faltando
            logger.warn('❌ [questionController] Campos obrigatórios faltando', 'QUESTIONS');
            //Retorna erro de campos obrigatórios faltando
            return res.status(400).json({ error: 'questionId e visibility são obrigatórios' });
        }

        if (!['public', 'private'].includes(visibility)) {
            //Log da visibilidade inválida
            logger.warn(`❌ [questionController] Visibilidade inválida: ${visibility}`, 'QUESTIONS');
            //Retorna erro de visibilidade inválida
            return res.status(400).json({ error: 'visibility deve ser "public" ou "private"' });
        }

        //Atualiza a visibilidade
        await updateQuestion(questionId, { 
            visibility, 
            //Log do ID do usuário que atualizou a visibilidade
            updated_by: userId
        });
        
        //Log da visibilidade alterada
        logger.info(`✅ [questionController] Visibilidade alterada: ${questionId} -> ${visibility}`, 'QUESTIONS');
        //Retorna a visibilidade alterada
        res.status(200).json({ message: 'Visibilidade alterada com sucesso', questionId, visibility });

    } catch (error) {
        //Log do erro
        logger.error(`Erro ao alterar visibilidade: ${error.message}`, 'QUESTIONS');
        //Retorna erro interno
        res.status(error.message.includes('Token') ? 401 : 500).json({ error: error.message });
    }
};

//Exporta os controllers
module.exports = {
    //Função de adição de questão
    addQuestionHandler, 
    getQuestionsHandler, 
    editQuestionHandler, 
    deleteQuestionHandler,
    updateQuestionVisibilityHandler
};
