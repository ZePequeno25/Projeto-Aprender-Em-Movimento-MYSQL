
import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '@/lib/api';
import { useToast } from './use-toast';
import { useAuth } from './useAuth';

// Relação entre professor e aluno
interface Relation {
  relationId?: string;
  teacherId: string;
  teacherName: string;
  studentId: string;
  studentName: string;
  createdAt: string;
}

export const useTeacherStudent = (userId?: string | undefined) => {
  const [relations, setRelations] = useState<Relation[]>([]);
  const [teacherCode, setTeacherCode] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  // Usar userId do parâmetro ou do user
  const currentUserId = userId || user?.uid;

  const fetchRelations = useCallback(async () => {
    // Aguardar até ter userId e userType disponível
    if (!currentUserId || !user?.userType) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      // Determinar a rota baseada no tipo de usuário
      let endpoint = '';
      if (user.userType === 'aluno') {
        endpoint = `/teacher-relations/${currentUserId}`;
      } else if (user.userType === 'professor') {
        endpoint = `/teacher-students/${currentUserId}`;
      } else {
        setLoading(false);
        return;
      }

      const response = await apiFetch(endpoint);
      if (!response.ok) {
        // Não mostrar erro para 404, apenas retornar array vazio
        if (response.status === 404) {
          setRelations([]);
          setLoading(false);
          return;
        }
        throw new Error('Falha ao carregar as relações');
      }
      const data = await response.json();
      // Mapear os dados para o formato esperado
      const mappedRelations = (Array.isArray(data) ? data : []).map((rel: any) => ({
        relationId: rel.relationId || rel.id,
        teacherId: rel.teacher_id || rel.teacherId,
        teacherName: rel.teacher_name || rel.teacherName,
        studentId: rel.student_id || rel.studentId,
        studentName: rel.student_name || rel.studentName,
        createdAt: rel.createdAt || rel.joined_at || rel.created_at
      }));
      setRelations(mappedRelations);
    } catch (err: any) {
      // Silenciar erros de rede/404 para não poluir a UI
      console.error('Erro ao buscar relações:', err.message);
      setRelations([]);
    } finally {
      setLoading(false);
    }
  }, [currentUserId, user?.userType, toast]);

  const generateTeacherCode = useCallback(async () => {
    if (!currentUserId || user?.userType !== 'professor') {
      toast({
        title: 'Erro',
        description: 'Apenas professores podem gerar códigos',
        variant: 'destructive',
      });
      return;
    }

    try {
      const response = await apiFetch('/teacher-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      if (response.ok) {
        const data = await response.json();
        const newCode = data.linkCode || '';
        setTeacherCode(newCode);
        // Recarregar o código para garantir que está atualizado
        await fetchTeacherCode();
        toast({
          title: 'Código gerado!',
          description: `Novo código criado: ${newCode}`,
        });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao gerar código');
      }
    } catch (err: any) {
      console.error('Erro ao gerar código:', err.message);
      toast({
        title: 'Erro',
        description: err.message || 'Erro ao gerar código',
        variant: 'destructive',
      });
    }
  }, [currentUserId, user?.userType, toast]);

  const fetchTeacherCode = useCallback(async () => {
    if (!currentUserId || user?.userType !== 'professor') {
      return;
    }

    try {
      const response = await apiFetch(`/teacher-code/${currentUserId}`);
      if (response.ok) {
        const data = await response.json();
        setTeacherCode(data.linkCode || '');
      } else {
        // Se não existe código, gerar um automaticamente
        if (response.status === 404) {
          await generateTeacherCode();
        }
      }
    } catch (err: any) {
      console.error('Erro ao buscar código do professor:', err.message);
      // Se der erro, tentar gerar um código
      await generateTeacherCode();
    }
  }, [currentUserId, user?.userType, generateTeacherCode]);

  const linkStudentToTeacher = useCallback(async (teacherCode: string) => {
    if (!currentUserId || user?.userType !== 'aluno') {
      toast({
        title: 'Erro',
        description: 'Apenas alunos podem se vincular a professores',
        variant: 'destructive',
      });
      return { success: false };
    }

    try {
      const response = await apiFetch('/link-student', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teacherCode: teacherCode.trim().toUpperCase(),
          studentId: currentUserId,
          studentName: user.nomeCompleto || 'Aluno'
        })
      });

      if (response.ok) {
        const data = await response.json();
        // Recarregar relações após vincular
        await fetchRelations();
        toast({
          title: 'Vinculação realizada!',
          description: `Você foi vinculado ao professor ${data.teacherName || 'com sucesso'}`,
        });
        return { success: true };
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao vincular ao professor');
      }
    } catch (err: any) {
      console.error('Erro ao vincular ao professor:', err.message);
      toast({
        title: 'Erro',
        description: err.message || 'Erro ao vincular ao professor. Verifique se o código está correto.',
        variant: 'destructive',
      });
      return { success: false };
    }
  }, [currentUserId, user, fetchRelations, toast]);

  const unlinkStudent = useCallback(async (studentId: string) => {
    if (!currentUserId || user?.userType !== 'professor') {
      return;
    }

    try {
      // Primeiro, buscar o relationId
      const relation = relations.find(r => r.studentId === studentId);
      if (!relation) {
        throw new Error('Relação não encontrada');
      }

      // A rota espera relationId (ID da relação, não do professor)
      if (!relation.relationId) {
        throw new Error('ID da relação não encontrado');
      }
      const response = await apiFetch(`/unlink-student/${relation.relationId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Atualizar lista de relações
        setRelations(prev => prev.filter(r => r.studentId !== studentId));
        toast({
          title: 'Aluno desvinculado',
          description: 'O aluno foi desvinculado com sucesso',
        });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao desvincular aluno');
      }
    } catch (err: any) {
      console.error('Erro ao desvincular aluno:', err.message);
      toast({
        title: 'Erro',
        description: err.message || 'Erro ao desvincular aluno',
        variant: 'destructive',
      });
    }
  }, [currentUserId, user?.userType, relations, toast]);

  useEffect(() => {
    fetchRelations();
    if (user?.userType === 'professor') {
      fetchTeacherCode();
    }
  }, [fetchRelations, fetchTeacherCode, user?.userType]);

  return { 
    relations, 
    teacherCode,
    loading, 
    error, 
    refetch: fetchRelations,
    generateTeacherCode,
    linkStudentToTeacher,
    unlinkStudent
  };
};
