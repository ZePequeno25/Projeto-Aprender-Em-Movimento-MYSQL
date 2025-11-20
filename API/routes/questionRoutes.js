//Importa o express
const express = require('express');
//Importa o router do express
const router = express.Router();
//Importa o middleware de autenticação
const authMiddleware = require('../middlewares/authMiddleware');
//Importa o controller de questão que contém as rotas de adição, obtenção, edição e exclusão de questão e visibilidade de questão
const { 
    addQuestionHandler, 
    getQuestionsHandler, 
    editQuestionHandler, 
    deleteQuestionHandler,
    updateQuestionVisibilityHandler
} = require('../controllers/questionController');

//Aplica o middleware de autenticação a todas as rotas
router.use(authMiddleware);

//Rota de adição de questão
router.post('/question', addQuestionHandler);
//Rota de obtenção de questões
router.get('/question', getQuestionsHandler);
//Rota de edição de questão
router.put('/question', editQuestionHandler);
//Rota de exclusão de questão
router.delete('/question', deleteQuestionHandler);
//Rota de visibilidade de questão
router.put('/question/visibility', updateQuestionVisibilityHandler);


router.post('/questions', addQuestionHandler);
//Rota de obtenção de questões
router.get('/questions', getQuestionsHandler);
//Rota de edição de questão
router.put('/questions/:questionId', editQuestionHandler);
//Rota de exclusão de questão
router.delete('/questions/:questionId', deleteQuestionHandler);
//Rota de visibilidade de questão
router.patch('/questions/:questionId/visibility', updateQuestionVisibilityHandler);

module.exports = router;