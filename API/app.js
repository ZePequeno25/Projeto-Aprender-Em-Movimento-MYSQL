const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const logger = require('./utils/logger');
const authRoutes = require('./routes/authRoutes');
const questionRoutes = require('./routes/questionRoutes');
const relationshipRoutes = require('./routes/relationshipRoutes');
const commentRoutes = require('./routes/commentRoutes');
const chatRoutes = require('./routes/chatRoutes');

// Carregar variáveis de ambiente
/**Variavel de Ambiente para o banco de dados */
dotenv.config({ path: path.resolve(__dirname, '.env') });
logger.info(`Variáveis de ambiente carregadas: DB_HOST=${process.env.DB_HOST || 'não definida'}, ALLOWED_ORIGINS=${process.env.ALLOWED_ORIGINS || 'não definida'}`);


//Inicializa o express
const app = express();

// Configurar CORS
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim())
  : ['https://id-preview--77c82926-cc52-4e97-9f3b-585910fae583.lovable.app', 'http://localhost:5173', 'http://localhost:3000', 'http://localhost:8080'];

// Em desenvolvimento, permitir todas as origens locais HTTP
const isDevelopment = process.env.NODE_ENV !== 'production';


app.use(
  cors({
    origin: (origin, callback) => {
      logger.info('Origem da requisição', 'APP', { origin: origin || 'sem origem' });
      
      // Permitir requisições sem origem (same-origin, Postman, etc)
      if (!origin) {
        return callback(null, true);
      }
      
      // Em desenvolvimento, permitir qualquer localhost HTTP
      if (isDevelopment && origin.startsWith('http://localhost:')) {
        return callback(null, true);
      }
      
      // Verificar se a origem está na lista permitida
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      
      logger.error(`Erro: Origin ${origin} not allowed by CORS`);
      callback(new Error('Origin not allowed by CORS'));
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
  })
);

//Permite que o express leia o corpo da requisição em formato JSON
app.use(express.json());

//Verifica se a API está funcionando Render
app.get('/api/health', (req, res) => res.status(200).json({ status: 'OK' }));

//Rotas da API
app.use('/api', authRoutes);
app.use('/api', questionRoutes);
app.use('/api', relationshipRoutes);
app.use('/api', commentRoutes);
app.use('/api', chatRoutes);

// Middleware de erro
app.use((err, req, res, next) => {
  logger.error(`Erro: ${err.message}`);
  res.status(500).json({ error: err.message });
});

//Inicializa o servidor na porta especificada na variável de ambiente ou na porta 5050
const PORT = process.env.PORT || 5050;
app.listen(PORT, () => {
  logger.info(`Servidor rodando na porta ${PORT}`);
});
