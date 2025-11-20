//Importa o express
const express = require('express');
//Importa o router do express
const router = express.Router();
//Importa o controller de autenticação que contém as rotas de registro, login, verificação de usuário para reset de senha e reset de senha
const authController = require('../controllers/authController');

//Rota de registro de usuário
router.post('/register', authController.register);
//Rota de login de usuário
router.post('/login', authController.login);
//Rota de verificação de usuário para reset de senha
router.post('/verify_user_for_password_reset', authController.verifyUserForPasswordResetHandler);
//Rota de reset de senha
router.post('/reset_password', authController.resetPassword);

//Exporta o router
module.exports = router;