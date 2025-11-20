//Importa o express
const express = require('express');
//Importa o router do express
const router = express.Router();
//Importa o controller de comentário que contém as rotas de adição de comentário, obtenção de comentários de professor, obtenção de comentários de aluno e adição de resposta de comentário
const {
    addCommentHandler,
    getTeacherCommentsHandler,
    getStudentCommentsHandler,
    addCommentResponseHandler
} = require('../controllers/commentController');
//Importa o middleware de autenticação
const authMiddleware = require('../middlewares/authMiddleware');

//Aplica o middleware de autenticação a todas as rotas
router.use(authMiddleware);
//Rota de adição de comentário
router.post('/comments/add', addCommentHandler);
//Rota de obtenção de comentários de professor
router.get('/teacher-comments/:teacherId', getTeacherCommentsHandler);
//Rota de obtenção de comentários de aluno
router.get('/student-comments/:studentId', getStudentCommentsHandler);
//Rota de adição de resposta de comentário
router.post('/comments-response', addCommentResponseHandler);

//Exporta o router
module.exports = router;