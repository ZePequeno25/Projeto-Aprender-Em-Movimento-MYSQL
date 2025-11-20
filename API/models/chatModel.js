const { getPool } = require('../utils/database');
const logger = require('../utils/logger');
const { v4: uuidv4 } = require('uuid');

const addChatMessage = async (messageData) => {
  try {
    const pool = getPool();
    const messageId = uuidv4();
    
    await pool.execute(
      `INSERT INTO chats (id, sender_id, sender_name, sender_type, receiver_id, message, created_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        messageId,
        messageData.sender_id,
        messageData.sender_name,
        messageData.sender_type,
        messageData.receiver_id,
        messageData.message,
        new Date()
      ]
    );
    
    return messageId;
  } catch (error) {
        logger.error(`Erro ao adicionar mensagem de chat: ${error.message}`);
        throw error;
    }
};

const getChatMessages = async (senderId, receiverId) => {
  try {
    const pool = getPool();
    
    const [rows] = await pool.execute(
      `SELECT * FROM chats 
       WHERE (sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?)
       ORDER BY created_at ASC`,
      [senderId, receiverId, receiverId, senderId]
    );
            
    const messages = rows.map(row => ({
      id: row.id,
      sender_id: row.sender_id,
      sender_name: row.sender_name,
      sender_type: row.sender_type,
      receiver_id: row.receiver_id,
      message: row.message,
      created_at: row.created_at ? row.created_at.toISOString() : null
    }));
            
        return messages;
  } catch (error) {
        logger.error(`Erro ao buscar mensagens de chat: ${error.message}`);
        throw error;
    }
};

// Função para listar conversas de um usuário (professores com quem já conversou)
const getUserConversations = async (userId) => {
  try {
    const pool = getPool();
    
    // Buscar todos os parceiros únicos com quem o usuário conversou
    const [rows] = await pool.execute(
      `SELECT 
        CASE 
          WHEN sender_id = ? THEN receiver_id
          ELSE sender_id
        END as partner_id,
        MAX(created_at) as last_message_at
       FROM chats
       WHERE sender_id = ? OR receiver_id = ?
       GROUP BY partner_id
       ORDER BY last_message_at DESC`,
      [userId, userId, userId]
    );
    
    // Buscar informações dos parceiros
    const conversations = [];
    const seenPartners = new Set();
    
    for (const row of rows) {
      if (row.partner_id && row.partner_id !== userId && !seenPartners.has(row.partner_id)) {
        seenPartners.add(row.partner_id);
        
        const [userRows] = await pool.execute(
          'SELECT id, nomeCompleto, userType FROM users WHERE id = ?',
          [row.partner_id]
        );
        
        if (userRows.length > 0) {
          const partner = userRows[0];
          conversations.push({
            partner_id: partner.id,
            partner_name: partner.nomeCompleto,
            partner_type: partner.userType,
            last_message_at: row.last_message_at ? row.last_message_at.toISOString() : null
          });
        }
      }
    }
    
    return conversations;
  } catch (error) {
    logger.error(`Erro ao buscar conversas do usuário: ${error.message}`);
    throw error;
  }
};

module.exports = {
    addChatMessage,
    getChatMessages,
    getUserConversations
};
