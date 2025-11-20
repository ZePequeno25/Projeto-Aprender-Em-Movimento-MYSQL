//Importa o token JWT
const { verifyToken } = require('../utils/jwt');
//Importa o logger
const logger = require('../utils/logger');
//Importa o modelo de chat que contém as funções de adição de mensagem, obtenção de mensagens e obtenção de conversas do usuário
const {addChatMessage, getChatMessages, getUserConversations} = require('../models/chatModel');
//Importa o modelo de usuário que contém as funções de verificação de professor e aluno e obtenção do nome do usuário
const {isProfessor, isStudent, getUserName} = require('../models/userModel');

//Função de obtenção do ID do usuário atual
const getCurrentUserId = async (req) => {
    //Obtém o token
    const token = req.headers.authorization?.replace('Bearer ', '');
    //Verifica se o token foi fornecido
    if(!token) throw new Error('No token provided');
    //Verifica o token
    const decodedToken = await verifyToken(token);
    //Retorna o ID do usuário
    return decodedToken.uid || decodedToken.userId;
};

//Função de verificação de ID válido
const isValidId = (id, paramName) => {
    //Verifica se o ID é válido
    if(!id || id === 'undefined' || typeof id !== 'string' || id.trim().length === 0){
        //Loga o ID inválido
        logger.warn(`ID inválido para ${paramName}: ${id}`);
        //Retorna false
        return false;
    }
    //Retorna true
    return true;
};

//Função de adição de mensagem de chat
const addChatMessageHandler = async (req, res) => {
    //Loga o início do envio de mensagem de chat
    logger.info('💬 [chatController] Iniciando envio de mensagem de chat', 'CHAT');
    
    try{
        //Obtém o ID do usuário atual
        const userId = await getCurrentUserId(req);
        //Loga o usuário autenticado
        logger.info(`👤 [chatController] Usuário autenticado: ${userId}`, 'CHAT');
        
        //Obtém os dados da mensagem
        const {receiverId, message} = req.body;
        //Loga os dados da mensagem
        logger.info(`📊 [chatController] Dados: receiverId=${receiverId}, message length=${message?.length}`, 'CHAT');
        
        if(!receiverId || !message){
            //Loga os campos obrigatórios faltando
            logger.warn('❌ [chatController] Campos obrigatórios faltando', 'CHAT');
            //Retorna erro de campos obrigatórios faltando
            return res.status(400).json({error: 'Missing required fields'});
        }
        if(!isValidId(receiverId)){
            //Loga o receiverId inválido
            logger.warn(`❌ [chatController] receiverId inválido: ${receiverId}`, 'CHAT');
            //Retorna erro de ID inválido
            return res.status(400).json({error: 'Invalid user ID'});
        }
        //Obtém o tipo de usuário
        const userType = (await isProfessor(userId)) ? 'professor' : (await isStudent(userId)) ? 'aluno' : null;
        //Verifica se o usuário é professor ou aluno
        if(!userType){
            //Loga que o usuário não é professor nem aluno
            logger.warn(`❌ [chatController] Usuário ${userId} não é professor nem aluno`, 'CHAT');
            //Retorna erro de usuário não autorizado
            return res.status(403).json({error: 'Only teachers and students can send messages'});
        }
        //Obtém os dados da mensagem
        const messageData = {
            //Loga o ID do remetente
            sender_id: userId,
            //Loga o nome do remetente
            sender_name: await getUserName(userId),
            //Loga o tipo de remetente
            sender_type: userType,
            //Loga o ID do receptor
            receiver_id: receiverId,
            //Loga a mensagem
            message
        };
        //Adiciona a mensagem
        const messageId = await addChatMessage(messageData);
        //Loga a mensagem enviada
        logger.info(`✅ [chatController] Mensagem enviada: ${messageId}`, 'CHAT');
        //Retorna a mensagem enviada
        res.status(201).json({message: 'Message sent', id: messageId});

    }catch(error){
        //Loga o erro
        logger.error('Erro ao enviar mensagem de chat', error, 'CHAT');
        //Retorna erro interno
        res.status(500).json({error: 'Internal server error'});
    }
};

//Função de obtenção de mensagens de chat
const getChatMessagesHandler = async (req, res) => {
    //Loga o início da busca de mensagens de chat
    logger.info('📨 [chatController] Buscando mensagens de chat', 'CHAT');
    
    try{
        //Obtém os IDs do remetente e do receptor
        const { senderId, receiverId } = req.query;
        //Loga os IDs do remetente e do receptor
        logger.info(`📊 [chatController] Params: senderId=${senderId}, receiverId=${receiverId}`, 'CHAT');
        
        if(!isValidId(senderId, 'sender_id') || !isValidId(receiverId, 'receiver_id')){
            //Loga os IDs inválidos
            logger.warn(`❌ [chatController] IDs inválidos`, 'CHAT');
            //Retorna erro de IDs inválidos
            return res.status(400).json({error: 'Invalid sender or recipient IDs'});
        }
        
        //Obtém o ID do usuário atual
        const userId = await getCurrentUserId(req);
        //Verifica se o usuário é o remetente ou o receptor
        if(userId !== senderId && userId !== receiverId){
            //Loga que o usuário não tem permissão
            logger.warn(`❌ [chatController] Usuário ${userId} sem permissão`, 'CHAT');
            //Retorna erro de usuário não autorizado
            return res.status(403).json({error: 'You can only view your own messages'});
        }
        
        //Obtém as mensagens
        const messages = await getChatMessages(senderId, receiverId);
        //Loga o número de mensagens encontradas
        logger.info(`✅ [chatController] ${messages.length} mensagens encontradas`, 'CHAT');
        res.status(200).json(messages);

    }catch(error){
        //Loga o erro
        logger.error(`Erro ao listar mensagens de chat`, error, 'CHAT');
        //Retorna erro interno
        res.status(500).json({error: error.message});
    }
};

//Função de obtenção de conversas do usuário
const getUserConversationsHandler = async (req, res) => {
    //Loga o início da busca de conversas do usuário
    logger.info('💬 [chatController] Buscando conversas do usuário', 'CHAT');
    
    try {
        const userId = await getCurrentUserId(req);
        logger.info(`👤 [chatController] Usuário autenticado: ${userId}`, 'CHAT');
        
        //Obtém as conversas
        const conversations = await getUserConversations(userId);
        //Loga o número de conversas encontradas
        logger.info(`✅ [chatController] ${conversations.length} conversas encontradas`, 'CHAT');
        res.status(200).json(conversations);
    } catch (error) {
        //Loga o erro
        logger.error(`Erro ao buscar conversas do usuário`, error, 'CHAT');
        //Retorna erro interno
        res.status(500).json({error: error.message});
    }
};

//Exporta os controllers
module.exports = {
    //Função de adição de mensagem de chat
    addChatMessageHandler,
    //Função de obtenção de mensagens de chat
    getChatMessagesHandler,
    getUserConversationsHandler
};
