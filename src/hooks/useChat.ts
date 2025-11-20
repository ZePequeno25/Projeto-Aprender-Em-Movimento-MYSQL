import { useState, useEffect, useCallback, useRef } from 'react';
import { apiFetch } from '@/lib/api';
import { useAuth } from './useAuth';

// Define the shape of a chat message
interface ChatMessage {
  id: string;
  senderId: string;
  receiverId: string;
  senderName: string;
  message: string;
  createdAt: string | Date;
}

export const useChat = (partnerId: string | null) => {
  const { user, loading: authLoading } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Function to fetch messages
  const fetchMessages = useCallback(async () => {
    if (!user || !partnerId) {
      setMessages([]);
      setLoading(false);
      return;
    }

    try {
      const response = await apiFetch(
        `/chat?senderId=${user.uid}&receiverId=${partnerId}`
      );

      if (response.ok) {
        const data = await response.json();
        const messagesArray = Array.isArray(data) ? data : [];

        // Mapear snake_case do backend para camelCase do frontend
        const mappedMessages: ChatMessage[] = messagesArray.map((msg: any) => ({
          id: msg.id,
          senderId: msg.sender_id || msg.senderId,
          receiverId: msg.receiver_id || msg.receiverId,
          senderName: msg.sender_name || msg.senderName,
          message: msg.message,
          createdAt: msg.created_at || msg.createdAt || new Date().toISOString()
        }));

        setMessages(mappedMessages);
        setLoading(false);
      } else {
        if (response.status === 404) {
          setMessages([]);
        } else {
          throw new Error('Falha ao carregar mensagens');
        }
        setLoading(false);
      }
    } catch (err: any) {
      console.error('Erro ao buscar mensagens:', err);
      setError(err.message || 'Falha ao carregar mensagens');
      setLoading(false);
    }
  }, [user, partnerId]);

  useEffect(() => {
    // Don't do anything if auth is loading, or there is no user or chat partner
    if (authLoading || !user || !partnerId) {
      setLoading(false);
      setMessages([]);
      // Limpar intervalo se existir
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
      return;
    }

    setLoading(true);
    
    // Buscar mensagens imediatamente
    fetchMessages();

    // Configurar polling para atualizar mensagens a cada 2 segundos (simula real-time)
    pollingIntervalRef.current = setInterval(() => {
      fetchMessages();
    }, 2000);

    // Cleanup: limpar intervalo quando o componente desmontar ou dependências mudarem
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, [user, partnerId, authLoading, fetchMessages]);

  // Function to send a message
  const sendMessage = async (message: string) => {
    if (!user || !partnerId || !message.trim()) {
      setError('Não é possível enviar mensagem. Usuário, destinatário ou mensagem inválidos.');
      return { success: false };
    }

    try {
      const response = await apiFetch('/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          receiverId: partnerId,
          message: message.trim()
        })
      });

      if (response.ok) {
        // Recarregar mensagens após enviar
        await fetchMessages();
        return { success: true };
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao enviar mensagem');
      }
    } catch (err: any) {
      console.error('Erro ao enviar mensagem:', err);
      setError(err.message || 'Falha ao enviar mensagem');
      return { success: false };
    }
  };

  return { messages, loading, error, sendMessage };
};
