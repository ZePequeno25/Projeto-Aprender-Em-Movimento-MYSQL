//Importa o express
const express = require('express');
//Importa o router do express
const router = express.Router();
//Importa o middleware de autenticação
const authMiddleware = require('../middlewares/authMiddleware');
//Importa o controller de chat que contém as rotas de adição de mensagem, obtenção de mensagens e obtenção de conversas do usuário
const {addChatMessageHandler, getChatMessagesHandler, getUserConversationsHandler} = require('../controllers/chatController');

//Aplica o middleware de autenticação a todas as rotas
router.use(authMiddleware);

//Rota de adição de mensagem
router.post('/chat', addChatMessageHandler);
//Rota de obtenção de mensagens
router.get('/chat', getChatMessagesHandler);
//Rota de obtenção de conversas do usuário
router.get('/chat/conversations', getUserConversationsHandler);

//Exporta o router
module.exports = router;