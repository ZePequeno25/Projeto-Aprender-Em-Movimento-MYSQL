//Importa o pool de conexões MySQL
const { getPool } = require('../utils/database');
//Importa o logger
const logger = require('../utils/logger');
//Importa o modelo de usuário que contém as funções de criação de usuário, verificação de credenciais de usuário, verificação de usuário para reset de senha, reset de senha e verificação de usuário por CPF para reset de senha
const { createUser, verifyUserCredentials, verifyUserPasswordReset, resetUserPassword, verifyUserByCpfForPasswordReset, formatDateForMySQL } = require('../models/userModel');
//Importa o token JWT
const { generateToken } = require('../utils/jwt');
//Importa o bcrypt
const bcrypt = require('bcrypt');
//Importa o uuid
const { v4: uuidv4 } = require('uuid');
//A quantidade de rounds de hash da senha
const SALT_ROUNDS = 10;

//Função de registro de usuário
const register = async (req, res) => {
  //Loga a requisição
  logger.logRequest(req, 'AUTH');
  try {
    //Obtém os dados do usuário
    const { nomeCompleto, cpf, userType, dataNascimento, password } = req.body;
    //Loga os dados do usuário
    
    //Loga os dados do usuário
    logger.debug('Dados recebidos para registro', 'AUTH', {
      //Loga o nome completo do usuário
      nomeCompleto,
      //Loga o CPF do usuário
      cpf: cpf ? cpf.substring(0, 3) + '***' : 'não fornecido',
      //Loga o tipo de usuário
      userType,
      //Loga a data de nascimento do usuário
      dataNascimento,
      //Loga se o usuário tem uma senha customizada
      hasCustomPassword: !!password,
      //Loga o tamanho da senha
      passwordLength: password ? password.length : 0
    });
    
    //Loga os dados do usuário
    console.log('📥 [REGISTER] Dados recebidos:', {
      //Loga o nome completo do usuário
      nomeCompleto,
      //Loga o CPF do usuário
      cpf: cpf ? cpf.substring(0, 3) + '***' : 'não fornecido',
      //Loga o tipo de usuário
      userType,
      //Loga se o usuário tem uma senha
      hasPassword: !!password,
      //Loga o tamanho da senha
      passwordLength: password ? password.length : 0,
      //Loga a senha preview
      passwordPreview: password ? password.substring(0, 3) + '***' : 'não fornecida'
    });

    // Validações obrigatórias
    if (!nomeCompleto || !cpf || !userType || !dataNascimento) {
      //Loga os campos obrigatórios faltando
      logger.warn('Campos obrigatórios faltando', 'AUTH', { 
        //Loga o nome completo do usuário
        nomeCompleto: !!nomeCompleto, 
        //Loga o CPF do usuário
        cpf: !!cpf, 
        //Loga o tipo de usuário
        userType: !!userType, 
        //Loga a data de nascimento do usuário
        dataNascimento: !!dataNascimento 
      });
      //Retorna erro de campos obrigatórios faltando
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Validação userType
    const validUserTypes = ['aluno', 'professor'];
    //Verifica se o userType é válido
    if (!validUserTypes.includes(userType)) {
      //Loga o userType inválido
      logger.warn('userType inválido', 'AUTH', { userType });
      //Retorna erro de userType inválido
      return res.status(400).json({ error: 'Formato do userType inválido' });
    }

    // Validação CPF
    if (!/^\d{11}$/.test(cpf)) {
      //Loga o CPF em formato inválido
      logger.warn('CPF em formato inválido', 'AUTH', { cpf: cpf ? cpf.substring(0, 3) + '***' : 'não fornecido' });
      //Retorna erro de CPF em formato inválido
      return res.status(400).json({ error: 'Formato do CPF inválido' });
    }

    //Loga a verificação de duplicação de CPF
    console.log('🔍 [REGISTER] Verificando duplicação de CPF...', {
      //Loga o CPF
      cpf: cpf.substring(0, 3) + '***',
      //Loga o tipo de usuário
      userType
    });

    // ✅ VERIFICAÇÃO DE CPF DUPLICADO usando MySQL
    //Obtém o pool de conexões MySQL
    const pool = getPool();
    //Verifica se o CPF já está cadastrado
    const [existingUsers] = await pool.execute(
      //Query para verificar se o CPF já está cadastrado
      'SELECT * FROM users WHERE cpf = ? AND userType = ?',
      [cpf, userType]
    );

    if (existingUsers.length > 0) {
      //Obtém o usuário existente
      const existingUser = existingUsers[0];
      //Loga o CPF já cadastrado
      console.log('❌ [REGISTER] CPF já cadastrado:', {
        //Loga o CPF
        cpf: cpf.substring(0, 3) + '***',
        //Loga o tipo de usuário
        userType,
        //Loga o email do usuário existente
        existingEmail: existingUser.email
      });
      
      //Loga o CPF já cadastrado para este tipo de usuário
      logger.warn('CPF já cadastrado para este tipo de usuário', 'AUTH', { 
        //Loga o CPF
        cpf: cpf.substring(0, 3) + '***', 
        //Loga o tipo de usuário
        userType 
      });
      
      //Retorna erro de CPF já cadastrado para este tipo de usuário
      return res.status(400).json({ 
        //Loga o erro
        error: `Tipo de usuário ou CPF já cadastrado` 
      });
    }

    //Loga o CPF livre para cadastro
    console.log('✅ [REGISTER] CPF livre para cadastro');

    //Obtém a senha final
    const finalPassword = (password && password.trim().length > 0) ? password : cpf;
    
    //Loga a geração de hash da senha
    console.log('🔐 [REGISTER] Gerando hash da senha...');
    //Loga a senha recebida
    console.log('🔐 [REGISTER] Password recebido:', password ? `"${password.substring(0, 3)}***" (${password.length} chars)` : 'não fornecido');
    //Loga a senha final a ser usada
    console.log('🔐 [REGISTER] Senha final a ser usada (primeiros 3 chars):', finalPassword ? finalPassword.substring(0, 3) + '***' : 'não fornecida');
    //Loga o tamanho da senha final
    console.log('🔐 [REGISTER] Tamanho da senha final:', finalPassword ? finalPassword.length : 0);
    //Loga se a senha é customizada
    console.log('🔐 [REGISTER] Usando senha customizada?', (password && password.trim().length > 0));
    //Gera o hash da senha
    const passwordHash = await bcrypt.hash(finalPassword, SALT_ROUNDS);
    //Loga o hash gerado
    console.log('🔐 [REGISTER] Hash gerado (primeiros 30 chars):', passwordHash.substring(0, 30) + '...');
    console.log('🔐 [REGISTER] Tamanho do hash:', passwordHash.length);
    //Gera a chave de hash
    const hashKey = passwordHash.replace(/[^a-zA-Z0-9]/g, '').substring(0, 16);
    //Gera o email do usuário
    const email = `${cpf}_${userType}_${hashKey}@saberemmovimento.com`;

    console.log('📧 [REGISTER] Email gerado:', email);
    console.log('🔑 [REGISTER] HashKey:', hashKey);

    // Verificar se email já existe no MySQL
    console.log('🔍 [REGISTER] Verificando email no MySQL...');
    //Verifica se o email já existe no MySQL
    const [emailCheck] = await pool.execute(
      //Query para verificar se o email já existe no MySQL
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    //Verifica se o email já existe no MySQL
    if (emailCheck.length > 0) {
      //Loga o email já existe no MySQL
      console.log('❌ [REGISTER] Email já existe no MySQL');
      return res.status(400).json({ error: 'Erro interno no cadastro - email duplicado' });
    }

    //Loga o email livre no MySQL
    console.log('✅ [REGISTER] Email livre no MySQL');

    // Criar userId único
    const userId = uuidv4();
    console.log('👤 [REGISTER] Criando usuário com ID:', userId);

    // Preparar dados para MySQL
    const now = new Date();
    const userData = {
      userId: userId,
      email,
      //Loga a senha hash
      password: passwordHash,
      //Loga o tipo de usuário
      userType,
      //Loga o nome completo do usuário
      nomeCompleto,
      //Loga o CPF do usuário
      cpf,
      //Loga a data de nascimento do usuário
      dataNascimento,
      //Loga a data de criação do usuário
      createdAt: now,
      //Loga a data de atualização do usuário
      updatedAt: now
    };

    //Loga a criação do usuário no MySQL
    console.log('💾 [REGISTER] Salvando usuário no MySQL...');
    await createUser(userData);

    //Loga a verificação do hash salvo no banco
    console.log('🔍 [REGISTER] Verificando hash salvo no banco...');
    const [verifyRows] = await pool.execute(
      //Query para verificar se o hash foi salvo corretamente
      'SELECT password FROM users WHERE id = ?',
      [userId]
    );
    //Verifica se o hash foi salvo corretamente
    if (verifyRows.length > 0) {
      //Obtém o hash salvo
      const savedHash = verifyRows[0].password;
      //Loga o hash salvo
      console.log('🔍 [REGISTER] Hash salvo (primeiros 30 chars):', savedHash ? savedHash.substring(0, 30) + '...' : 'NULL');
      //Loga o tamanho do hash salvo
      console.log('🔍 [REGISTER] Tamanho do hash salvo:', savedHash ? savedHash.length : 0);
      //Loga se o hash corresponde ao gerado
      console.log('🔍 [REGISTER] Hash corresponde ao gerado?', savedHash === passwordHash);
      
      //Loga a comparação imediatamente após salvar
      const testCompare = await bcrypt.compare(finalPassword, savedHash);
      //Loga a comparação imediatamente após salvar
      console.log('🔍 [REGISTER] Teste de comparação após salvar:', testCompare);
    }

    // Log de sucesso
    logger.logAuth('REGISTER', userId, true, { 
      //Loga o email do usuário
      email, 
      //Loga o tipo de usuário
      userType,
      //Loga se o usuário usou uma senha customizada
      usedCustomPassword: !!password 
    });

    console.log('🎉 [REGISTER] Cadastro concluído com sucesso!', {
      //Loga o ID do usuário
      userId: userId,
      //Loga o email do usuário
      email,
      //Loga o tipo de usuário
      userType
    });

    // Response de sucesso
    res.status(201).json({ 
      //Loga o ID do usuário
      userId: userId, 
      //Loga o email do usuário
      email, 
      //Loga a mensagem de sucesso
      message: 'User registered successfully',
      //Loga se o usuário usou uma senha padrão
      usedDefaultPassword: !password
    });

  } catch (error) {
    //Loga o erro no cadastro
    console.error('❌ [REGISTER] Erro no cadastro:', error);
    logger.logError(error, 'AUTH');
    
    //Loga o tratamento de erros específicos do MySQL
    if (error.code === 'ER_DUP_ENTRY') {
      //Loga o erro de email ou CPF já cadastrado
      return res.status(400).json({ error: 'Email ou CPF já cadastrado' });
    }
    
    //Loga o erro
    res.status(500).json({ error: error.message });
  }
};

const login = async (req, res) => {
  //Loga a requisição
  logger.logRequest(req, 'AUTH');
  
try {
    //Obtém os dados do usuário
    const { email, password, cpf, userType } = req.body;

    //Verifica se o CPF, userType, senha e email foram fornecidos
    if (cpf && userType && password && !email) {
      //Loga o login simplificado
      console.log('=== LOGIN SIMPLIFICADO ===');
      
      //Normaliza o CPF
      const normalizedCpf = cpf.replace(/\D/g, '');
      //Normaliza o userType
      const normalizedUserType = userType.toLowerCase();
      //Loga o CPF normalizado
      console.log('CPF (normalizado):', normalizedCpf);
      //Loga o userType normalizado
      console.log('UserType (normalizado):', normalizedUserType);
      
      console.log('CPF (normalizado):', normalizedCpf);
      console.log('UserType (normalizado):', normalizedUserType);

      //Obtém o pool de conexões MySQL
      const pool = getPool();
      //Query para buscar o usuário
      const [userRows] = await pool.execute(
        //Query para buscar o usuário
        'SELECT * FROM users WHERE cpf = ? AND userType = ?',
        [normalizedCpf, normalizedUserType]
      );

      //Loga o número de usuários encontrados
      console.log('🎯 Usuários encontrados:', userRows.length);

      //Verifica se nenhum usuário foi encontrado
      if (userRows.length === 0) {
        //Loga que nenhum usuário foi encontrado
        console.log('❌ Nenhum usuário com CPF:', normalizedCpf, 'e tipo:', normalizedUserType);
        return res.status(401).json({ error: 'Usuário ou senha ou tipo incorreta' });
      }

      //Obtém os dados do usuário
      const userData = userRows[0];
      //Loga o email do usuário
      console.log('✅ Usuário encontrado:', userData.email);
      //Loga o hash armazenado
      console.log('🔐 [LOGIN] Hash armazenado (primeiros 30 chars):', userData.password ? userData.password.substring(0, 30) + '...' : 'NULL');
      //Loga o tamanho do hash armazenado
      console.log('🔐 [LOGIN] Tamanho do hash armazenado:', userData.password ? userData.password.length : 0);
      //Loga a senha recebida
      console.log('🔐 [LOGIN] Senha recebida (primeiros 3 chars):', password ? password.substring(0, 3) + '***' : 'não fornecida');
      //Loga o tamanho da senha recebida
      console.log('🔐 [LOGIN] Tamanho da senha recebida:', password ? password.length : 0);

      //Verifica se o hash existe
      if (!userData.password) {
        //Loga que o hash de senha não foi encontrado no banco
        console.log('❌ [LOGIN] Hash de senha não encontrado no banco!');
        return res.status(401).json({ error: 'Usuário ou senha ou tipo incorreta' });
      }

      //Verifica a senha diretamente com o hash salvo
      console.log('🔐 [LOGIN] Verificando senha com bcrypt.compare...');
      const passwordMatch = await bcrypt.compare(password, userData.password);
      //Loga o resultado da comparação
      console.log('🔐 [LOGIN] Resultado da comparação:', passwordMatch);
      
      if (!passwordMatch) {
        //Loga que a senha está incorreta
        console.log('🔐 [LOGIN] Tentando comparar com CPF como fallback...');
        const cpfMatch = await bcrypt.compare(normalizedCpf, userData.password);
        //Loga a comparação com o CPF
        console.log('🔐 [LOGIN] Comparação com CPF:', cpfMatch);
      }

      if (!passwordMatch) {
        //Loga que a senha está incorreta
        console.log('❌ Senha incorreta');
        return res.status(401).json({ error: 'Usuário ou senha ou tipo incorreta' });
      }

      //Loga que o login foi bem-sucedido
      console.log('✅ Login bem-sucedido!');

      //Gera o token JWT
      const token = generateToken(userData.id, userData.email, userData.userType);

      //Loga o token gerado
      console.log('🔑 [LOGIN] Token gerado');

      //Salva o token no campo correto (currentToken)
      console.log('💾 [LOGIN] Salvando token no MySQL...');
      //Obtém a data atual
      const now = formatDateForMySQL(new Date());
      //Query para salvar o token no campo correto (currentToken)
      await pool.execute(
        'UPDATE users SET currentToken = ?, lastLogin = ?, updatedAt = ? WHERE id = ?',
        [token, now, now, userData.id]
      );
      //Loga que o token foi salvo no campo currentToken do usuário
      console.log('✅ Token salvo no campo currentToken do usuário:', userData.id);

      return res.status(200).json({ 
        //Loga o ID do usuário
        userId: userData.id, 
        //Loga o token
        token, 
        //Loga o tipo de usuário
        userType: userData.userType, 
        //Loga o nome completo do usuário
        nomeCompleto: userData.nomeCompleto, 
        //Loga o email do usuário
        email: userData.email 
      });
    }
    
    //Verifica se o email e a senha foram fornecidos
    if (email && password) {
      //Verifica as credenciais do usuário
      const user = await verifyUserCredentials(email, password);
      //Verifica se o usuário foi encontrado
      if (!user) {
        return res.status(401).json({ error: 'Usuário ou senha ou tipo incorreta' });
      }

      //Gera o token JWT
      const token = generateToken(user.userId, user.email, user.userType);
      
      //Salva o token
      const pool = getPool();
      //Obtém a data atual
      const now = formatDateForMySQL(new Date());
      //Query para salvar o token no campo correto (currentToken)
      await pool.execute(
        'UPDATE users SET currentToken = ?, lastLogin = ?, updatedAt = ? WHERE id = ?',
        [token, now, now, user.userId]
      );
      
      return res.status(200).json({ 
        //Loga o ID do usuário
        userId: user.userId, 
        //Loga o token
        token, 
        //Loga o tipo de usuário
        userType: user.userType, 
        //Loga o nome completo do usuário
        nomeCompleto: user.nomeCompleto, 
        //Loga o email do usuário
        email 
      });
    }

    return res.status(400).json({ error: 'Missing required fields' });

  } catch (error) {
    //Loga o erro
    logger.logError(error, 'AUTH');
    //Retorna erro interno
    res.status(500).json({ error: error.message });
  }
};

const verifyUserForPasswordResetHandler = async (req, res) => {
    //Loga a requisição
    logger.logRequest(req, 'PASSWORD_RESET');
    
    try {
        //Obtém os dados do usuário
        const { email, dataNascimento, cpf, userType } = req.body;
        //Loga a verificação do usuário
        
        console.log('🔍 [PasswordReset] Verificando usuário:', { 
            //Loga o email do usuário
            email, 
            //Loga a data de nascimento do usuário
            dataNascimento,
            //Loga o CPF do usuário
            cpf: cpf ? cpf.substring(0, 3) + '***' : 'não fornecido',
            //Loga o tipo de usuário
            userType
        });

        //Obtém o usuário
        let user;

        //Verifica se o CPF, userType e email foram fornecidos
        if (cpf && userType && !email) {
            //Loga a verificação por CPF
            console.log('🔄 [PasswordReset] Usando verificação por CPF...');
            //Verifica se o CPF é válido
            
            if (!/^\d{11}$/.test(cpf)) {
                //Loga o CPF inválido
                console.log('❌ [PasswordReset] CPF inválido:', cpf);
                return res.status(400).json({ error: 'Formato do CPF inválido' });
            }

            //Obtém os tipos de usuários válidos
            const validUserTypes = ['aluno', 'professor'];
            //Verifica se o tipo de usuário é válido
            if (!validUserTypes.includes(userType)) {
                //Loga o tipo de usuário inválido
                console.log('❌ [PasswordReset] UserType inválido:', userType);
                return res.status(400).json({ error: 'Formato do userType inválido' });
            }

            //Verifica se o usuário foi encontrado
            user = await verifyUserByCpfForPasswordReset(cpf, userType);

        //Verifica se o email e a data de nascimento foram fornecidos
        } else if (email && dataNascimento && !cpf) {
            //Loga a verificação por email
            console.log('🔄 [PasswordReset] Usando verificação por email...');
            user = await verifyUserPasswordReset(email, dataNascimento);

        } else {
            //Loga os campos obrigatórios faltando
            console.log('❌ [PasswordReset] Campos insuficientes');
            //Loga os campos obrigatórios faltando
            logger.warn('Campos obrigatórios faltando', 'PASSWORD_RESET', { 
                //Loga o email do usuário
                email: !!email, 
                //Loga a data de nascimento do usuário
                dataNascimento: !!dataNascimento,
                //Loga o CPF do usuário
                cpf: !!cpf,
                //Loga o tipo de usuário
                userType: !!userType
            });
            return res.status(400).json({ 
                //Loga o erro
                error: 'Forneça (email + dataNascimento) OU (cpf + userType)' 
            });
        }
        
        if(!user){
            //Loga que o usuário não foi encontrado
            console.log('❌ [PasswordReset] Usuário não encontrado');
            //Loga as credenciais inválidas
            logger.warn('Credenciais inválidas', 'PASSWORD_RESET', { 
                //Loga o CPF do usuário
                cpf: cpf ? cpf.substring(0, 3) + '***' : 'não fornecido',
                //Loga o tipo de usuário
                userType 
            });
            //Retorna erro de credenciais inválidas
            return res.status(401).json({ error: 'CPF não encontrado ou tipo de usuário incorreto' });
        }

        console.log('✅ [PasswordReset] Usuário verificado com sucesso:', {
            //Loga o ID do usuário
            userId: user.userId,
            //Loga o email do usuário
            email: user.email
        });

        logger.info(`Usuário verificado para redefinição de senha: ${user.userId}`, 'PASSWORD_RESET');

        res.status(200).json({ 
            //Loga o ID do usuário
            userId: user.userId, 
            //Loga o email do usuário
            email: user.email,
            //Loga a mensagem de sucesso
            message: 'Usuário verificado com sucesso' 
        });

    } catch (error) {
        //Loga o erro
        console.error('❌ [PasswordReset] Erro ao verificar usuário:', error);
        //Loga o erro
        logger.error(`Erro ao verificar usuário para redefinição de senha: ${error.message}`, 'PASSWORD_RESET');
        res.status(500).json({ error: error.message });
    }
};

const resetPassword = async (req, res) => {
    //Loga a requisição
    logger.logRequest(req, 'PASSWORD_RESET');
    
    try {
        //Obtém os dados do usuário
        const { userId, newPassword } = req.body;
        //Loga a redefinição de senha
        
        console.log('🔐 [ResetPassword] Redefinindo senha:', { 
            //Loga o ID do usuário
            userId, 
            //Loga o tamanho da nova senha
            newPasswordLength: newPassword?.length 
        });

        if(!userId || !newPassword){
            //Loga os campos obrigatórios faltando
            logger.warn('UserId ou newPassword ausentes', 'PASSWORD_RESET', { 
                //Loga o ID do usuário
                userId: !!userId, 
                //Loga a nova senha
                newPassword: !!newPassword 
            });
            //Retorna erro de campos obrigatórios faltando
            return res.status(400).json({ error: 'UserId e nova senha são obrigatórios' });
        }

        // Validação de força da senha (opcional)
        if(newPassword.length < 6){
            //Retorna erro de senha inválida
            return res.status(400).json({ error: 'A senha deve ter pelo menos 6 caracteres' });
        }

        console.log('🔄 [ResetPassword] Atualizando senha no MySQL...');
        // Atualizar no MySQL (com hash)
        await resetUserPassword(userId, newPassword);

        //Loga a senha redefinida para o usuário
        logger.info(`Senha redefinida para usuário: ${userId}`, 'PASSWORD_RESET');
        
        //Loga a senha redefinida com sucesso
        console.log('✅ [ResetPassword] Senha redefinida com sucesso');

        res.status(200).json({ 
            //Loga a mensagem de sucesso
            message: 'Senha redefinida com sucesso' 
        });

    } catch (error) {
        //Loga o erro
        console.error('❌ [ResetPassword] Erro ao redefinir senha:', error);
        //Loga o erro
        logger.error(`Erro ao redefinir senha: ${error.message}`, 'PASSWORD_RESET');
        
        //Retorna erro interno
        res.status(500).json({ error: error.message });
    }
};

//Exporta os controllers
module.exports = { register, login, resetPassword, verifyUserForPasswordResetHandler };
