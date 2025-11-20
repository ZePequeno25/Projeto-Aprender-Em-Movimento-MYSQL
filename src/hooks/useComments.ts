import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '@/lib/api';
import { useAuth } from './useAuth';

// Define the shape of a comment
interface Comment {
  id: string;
  questionId: string;
  userId: string;
  userName: string;
  userType: 'aluno' | 'professor';
  message: string;
  createdAt: string;
  responses: Response[];
}

// Define the shape of a response
interface Response {
  id: string;
  userId: string;
  userName: string;
  userType: 'aluno' | 'professor';
  message: string;
  createdAt: string;
}

export const useComments = () => {
  const { user, loading: authLoading } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch comments based on user type
  const fetchComments = useCallback(async () => {
    if (authLoading || !user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let endpoint = '';
      if (user.userType === 'professor') {
        endpoint = `/teacher-comments/${user.uid}`;
      } else if (user.userType === 'aluno') {
        endpoint = `/student-comments/${user.uid}`;
      } else {
        setLoading(false);
        return;
      }

      const response = await apiFetch(endpoint);
      
      if (response.ok) {
        const data = await response.json();
        // A resposta pode vir como {comments: [...]} ou array direto
        const commentsArray = data.comments || (Array.isArray(data) ? data : []);
        
        // Mapear para o formato esperado pelo frontend
        const mappedComments: Comment[] = commentsArray.map((c: any) => ({
          id: c.id,
          questionId: c.questionId || c.question_id,
          userId: c.userId || c.user_id,
          userName: c.userName || c.user_name,
          userType: c.userType || c.user_type,
          message: c.message,
          createdAt: c.createdAt || c.created_at || new Date().toISOString(),
          responses: (c.responses || []).map((r: any) => ({
            id: r.id,
            userId: r.userId || r.user_id,
            userName: r.userName || r.user_name,
            userType: r.userType || r.user_type,
            message: r.message,
            createdAt: r.createdAt || r.created_at || new Date().toISOString()
          }))
        }));
        
        setComments(mappedComments);
      } else {
        if (response.status === 404) {
          setComments([]);
        } else {
          throw new Error('Falha ao carregar comentários');
        }
      }
    } catch (err: any) {
      console.error('Erro ao buscar comentários:', err);
      setError(err.message || 'Falha ao carregar comentários');
      setComments([]);
    } finally {
      setLoading(false);
    }
  }, [user, authLoading]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  // Function to add a new comment
  const addComment = async (questionId: string, questionTheme: string, questionText: string, message: string) => {
    if (!user) {
      setError("Usuário não autenticado.");
      return { success: false };
    }

    // Verificar se o token existe
    const token = localStorage.getItem('authToken');
    if (!token) {
      console.error('❌ [useComments] Token não encontrado ao tentar adicionar comentário');
      setError("Token de autenticação não encontrado. Por favor, faça login novamente.");
      return { success: false };
    }

    try {
      console.log('📤 [useComments] Enviando comentário para:', '/comments/add');
      const response = await apiFetch('/comments/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionId,
          questionTheme,
          questionText,
          userName: user.nomeCompleto,
          userType: user.userType,
          message
        })
      });

      if (response.ok) {
        // Recarregar comentários após adicionar
        await fetchComments();
        return { success: true };
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao adicionar comentário');
      }
    } catch (err: any) {
      console.error("Erro ao adicionar comentário:", err);
      setError(err.message || "Falha ao adicionar comentário.");
      return { success: false };
    }
  };

  // Function to add a response to a comment
  const addResponse = async (commentId: string, message: string) => {
    if (!user) {
      setError("Usuário não autenticado.");
      return { success: false };
    }

    try {
      const response = await apiFetch('/comments-response', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          commentId,
          userName: user.nomeCompleto,
          userType: user.userType,
          message
        })
      });

      if (response.ok) {
        // Recarregar comentários após adicionar resposta
        await fetchComments();
        return { success: true };
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao adicionar resposta');
      }
    } catch (err: any) {
      console.error("Erro ao adicionar resposta:", err);
      setError(err.message || "Falha ao adicionar resposta.");
      return { success: false };
    }
  };

  return { comments, loading, error, addComment, addResponse, refetch: fetchComments };
};
