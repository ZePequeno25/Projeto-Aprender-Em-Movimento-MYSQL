//Importa o express
const express = require('express');
//Importa o router do express
const router = express.Router();
//Importa o middleware de autenticação
const authMiddleware = require('../middlewares/authMiddleware');
//Importa o controller de relacionamento que contém as rotas de geração de código de professor, obtenção de código de professor, link de aluno por código, obtenção de alunos de professor, obtenção de relacionamentos de professor e exclusão de relacionamento de aluno
const {
    generateTeacherCode,
    getTeacherCodeHandler,
    linkStudentByCode,
    getTeacherStudentsHandler,
    getStudentRelationsHandler,
    unlinkStudent,
    getStudentsHandler
} = require('../controllers/relationshipController');

//Aplica o middleware de autenticação a todas as rotas
router.use(authMiddleware);

//Rota de geração de código de professor
router.post('/teacher-code', generateTeacherCode);
//Rota de obtenção de código de professor
router.get('/teacher-code/:teacherId', getTeacherCodeHandler);
//Rota de link de aluno por código
router.post('/link-student', linkStudentByCode);
//Rota de obtenção de alunos de professor
router.get('/teacher-students/:teacherId', getTeacherStudentsHandler);
//Rota de obtenção de relacionamentos de professor
router.get('/teacher-relations/:studentId', getStudentRelationsHandler);
//Rota de exclusão de relacionamento de aluno
router.delete('/unlink-student/:relationId', unlinkStudent);
//Rota de obtenção de dados de alunos
router.get('/students_data', getStudentsHandler);

//Exporta o router
module.exports = router;