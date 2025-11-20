/**
 * ==================== PÁGINA INICIAL (INDEX) ====================
 * 
 * DESCRIÇÃO:
 * Landing page do aplicativo "Saber em Movimento"
 * Exibe informações sobre a plataforma e opções de login/registro
 * 
 * COMPORTAMENTO:
 * - Se usuário não está logado: mostra landing page com CTA
 * - Se usuário está logado: redireciona para área apropriada (professor/aluno)
 * - Persiste última rota visitada para restaurar após refresh
 * 
 * NAVEGAÇÃO AUTOMÁTICA:
 * - Professor logado → /professor
 * - Aluno logado → /student
 * - Última rota visitada (se existir)
 */

import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate, useLocation } from "react-router-dom";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Users, Trophy, Brain } from "lucide-react";

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // LOG: Rastreamento da página inicial
  console.log('📍 [INDEX] Página carregada', {
    pathname: location.pathname,
    userLogado: !!user,
    userType: user?.userType,
    loading
  });

  /**
   * EFEITO 1: Persistir última rota visitada
   * Salva a rota atual no localStorage quando usuário está logado
   */
  useEffect(() => {
    if (user) {
      console.log('💾 [INDEX] Salvando última rota visitada:', location.pathname);
      localStorage.setItem('lastRoute', location.pathname);
    }
  }, [location, user]);

  /**
   * EFEITO 2: Redirecionamento automático
   * Redireciona usuário logado para área apropriada
   * Prioridade: lastRoute > userType específico
   */
  useEffect(() => {
    if (!loading && user) {
      const lastRoute = localStorage.getItem('lastRoute');
      console.log('🔀 [INDEX] Redirecionando usuário logado', {
        lastRoute,
        userType: user.userType,
        destino: lastRoute && lastRoute !== '/' ? lastRoute : (user.userType === 'professor' ? '/professor' : '/student')
      });
      
      if (lastRoute && lastRoute !== '/') {
        console.log('✅ [INDEX] Redirecionando para última rota:', lastRoute);
        navigate(lastRoute);
      } else if (user.userType === 'professor') {
        console.log('✅ [INDEX] Redirecionando professor para /professor');
        navigate('/professor');
      } else {
        console.log('✅ [INDEX] Redirecionando aluno para /student');
        navigate('/student');
      }
    }
  }, [user, loading, navigate]);

  // ESTADO: Carregando autenticação
  if (loading) {
    console.log('⏳ [INDEX] Aguardando verificação de autenticação...');
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">Carregando...</div>
      </div>
    );
  }

  // ESTADO: Usuário logado (useEffect cuidará do redirecionamento)
  if (user) {
    console.log('✅ [INDEX] Usuário autenticado detectado, aguardando redirecionamento...');
    return null;
  }

  // ESTADO: Usuário não logado - exibir landing page
  console.log('👤 [INDEX] Exibindo landing page para visitante não autenticado');

  return (
    <div className="min-h-screen bg-background">
      <Header />
        
        <div className="container mx-auto py-8 sm:py-12 lg:py-16 px-4 sm:px-6 lg:px-8 max-w-7xl">
        <div className="text-center mb-8 sm:mb-12">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-primary mb-3 sm:mb-4">
            Saber em Movimento
          </h1>
          <p className="text-base sm:text-lg lg:text-xl text-muted-foreground max-w-2xl mx-auto px-4">
              Uma plataforma educacional interativa que combina aprendizado com movimento, 
              inspirada na capoeira e na educação inclusiva.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8 sm:mb-12">
            <Card className="text-center">
              <CardHeader>
                <Brain className="w-12 h-12 text-primary mx-auto mb-2" />
                <CardTitle>Aprendizado Interativo</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Questionários dinâmicos com feedback instantâneo
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <Trophy className="w-12 h-12 text-accent mx-auto mb-2" />
                <CardTitle>Sistema de Graduação</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Progrida através dos cordões da capoeira conforme aprende
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <BookOpen className="w-12 h-12 text-emerald-600 mx-auto mb-2" />
                <CardTitle>Múltiplos Temas</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Tecnologia, História, Ciência e muito mais
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <Users className="w-12 h-12 text-blue-600 mx-auto mb-2" />
                <CardTitle>Gestão Educacional</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Professores podem gerenciar conteúdos e acompanhar progresso
                </CardDescription>
              </CardContent>
            </Card>
          </div>

          <div className="text-center space-y-4">
            <h2 className="text-xl sm:text-2xl font-semibold text-foreground mb-4 sm:mb-6">
              Comece sua jornada educacional agora!
            </h2>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
              <Button 
                size="lg" 
                onClick={() => {
                  console.log('🔘 [INDEX] Botão "Fazer Login" clicado - navegando para /login');
                  navigate('/login');
                }}
                className="w-full sm:w-auto"
              >
                Fazer Login
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                onClick={() => {
                  console.log('🔘 [INDEX] Botão "Criar Conta" clicado - navegando para /register');
                  navigate('/register');
                }}
                className="w-full sm:w-auto"
              >
                Criar Conta
              </Button>
            </div>
          </div>
      </div>
    </div>
  );
};

export default Index;
