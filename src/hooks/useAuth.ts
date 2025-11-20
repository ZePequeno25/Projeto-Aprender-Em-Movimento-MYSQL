import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '@/lib/api';

interface User {
  uid: string;
  email: string;
  nomeCompleto: string;
  userType: 'aluno' | 'professor';
  cpf: string;
  score?: number;
  rank?: string;
}

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  const cleanCpf = (cpf: string): string => {
    return cpf.replace(/[\.\-]/g, '');
  };

  useEffect(() => {
    // Verificar se há usuário salvo no localStorage
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      try {
        const userData = JSON.parse(savedUser);
        setUser(userData);
      } catch (error) {
        console.error('❌ [useAuth] Erro ao carregar usuário salvo:', error);
        localStorage.removeItem('currentUser');
        setUser(null);
      }
    }
    setLoading(false);
  }, []);

  const login = async (cpf: string, password: string, userType: 'aluno' | 'professor') => {
    const cleanedCpf = cleanCpf(cpf);
    if (!cleanedCpf || !/^\d{11}$/.test(cleanedCpf)) {
      toast({
        title: 'Erro no login',
        description: 'O CPF deve conter 11 dígitos numéricos.',
        variant: 'destructive',
      });
      return { success: false, error: 'Invalid CPF format' };
    }

    try {
      const response = await apiFetch('/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cpf, password, userType }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro no login');
      }

      const data = await response.json();
      const { token, ...userDataResponse } = data;

      // Salvar token e dados do usuário
      const userData = {
        uid: userDataResponse.userId,
        email: userDataResponse.email,
        nomeCompleto: userDataResponse.nomeCompleto,
        userType: userDataResponse.userType,
        cpf: cleanedCpf,
      };

      // Salvar token JWT no localStorage para uso nas requisições
      localStorage.setItem('authToken', token);
      localStorage.setItem('currentUser', JSON.stringify(userData));
      setUser(userData);

      toast({
        title: 'Login realizado com sucesso!',
        description: `Bem-vindo, ${userData.nomeCompleto}`,
      });

      navigate(userType === 'aluno' ? '/student' : '/professor');
      return { success: true };

    } catch (error: any) {
      console.error('❌ [useAuth] Erro no login:', error.message);
      toast({
        title: 'Erro no login',
        description: error.message || 'Erro ao tentar fazer login',
        variant: 'destructive',
      });
      return { success: false, error: error.message };
    }
  };

  const register = async (userData: any) => {
    try {
      const cleanedCpf = cleanCpf(userData.cpf);
      if (!cleanedCpf || !/^\d{11}$/.test(cleanedCpf)) {
        toast({
          title: 'Erro no cadastro',
          description: 'O CPF deve conter 11 dígitos numéricos.',
          variant: 'destructive',
        });
        return { success: false, error: 'Invalid CPF format' };
      }

      const response = await apiFetch('/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...userData,
          cpf: cleanedCpf,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro no cadastro');
      }

      const data = await response.json();
      
      toast({
        title: 'Cadastro realizado com sucesso!',
        description: 'Sua conta foi criada. Faça login para continuar.',
      });

      return { success: true };

    } catch (error: any) {
      console.error('❌ [useAuth] Erro no cadastro:', error.message);
      toast({
        title: 'Erro no cadastro',
        description: error.message || 'Erro ao tentar se cadastrar',
        variant: 'destructive',
      });
      return { success: false, error: error.message };
    }
  };

  const logout = () => {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('authToken');
    setUser(null);
    toast({
      title: 'Logout realizado',
      description: 'Até logo!',
    });
    navigate('/');
  };

  const getAuthToken = async () => {
    return localStorage.getItem('authToken');
  };

  return {
    user, 
    loading, 
    login, 
    register,
    logout,
    getAuthToken
  };
};