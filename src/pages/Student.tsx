import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useTeacherStudent } from "@/hooks/useTeacherStudent";
import Header from "@/components/Header";
import StudentLinkForm from "@/components/StudentLinkForm";
import QuestionComments from "@/components/QuestionComments";
import ChatWindow from "@/components/ChatWindow";
import { Play, Trophy, Clock, CheckCircle, Pause, RotateCcw, Link, MessageCircle } from "lucide-react";
import { apiFetch } from "@/lib/api";

interface Question {
  id: string;
  theme: string;
  question: string;
  options: string[];
  correctOptionIndex: number;
  feedback: {
    title: string;
    text: string;
    illustration: string;
  };
  createdBy?: string;
  visibility: 'public' | 'private';
}

const Student = () => {
  const { user, loading: authLoading } = useAuth(); // Get the loading state from useAuth
  const { toast } = useToast();
  const { relations } = useTeacherStudent(user?.uid); // Pass user id to the hook

  const [questions, setQuestions] = useState<Question[]>([]);
  const [quizQuestions, setQuizQuestions] = useState<Question[]>([]);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chattingWith, setChattingWith] = useState<{id: string, name: string, type: 'aluno' | 'professor'} | null>(null);
  const [componentLoading, setComponentLoading] = useState(true);
  const [conversations, setConversations] = useState<Array<{partner_id: string, partner_name: string, partner_type: string, last_message_at: string | null}>>([]);

  // Quiz states
  const [quizState, setQuizState] = useState(() => {
    const saved = user ? localStorage.getItem(`quizState_${user.uid}`) : null;
    return saved ? JSON.parse(saved) : {
      score: user?.score || 0,
      questionIndex: 0,
      isQuizActive: false,
      showFeedback: false,
      selectedTheme: "all",
      selectedVisibility: "public",
      selectedTeacher: "all",
      timeLeft: 20,
      isPaused: false,
      selectedAnswer: null as number | null
    };
  });

  const { 
    score, questionIndex, isQuizActive, showFeedback, 
    selectedTheme, selectedVisibility, selectedTeacher, timeLeft, isPaused, selectedAnswer
  } = quizState;

  const updateQuizState = (newState: Partial<typeof quizState>) => {
    setQuizState(prevState => ({ ...prevState, ...newState }));
  };

  useEffect(() => {
    if (user) {
      localStorage.setItem(`quizState_${user.uid}`, JSON.stringify(quizState));
    }
  }, [quizState, user]);


  const capoeiraRanks = [
    { score: 0, title: "Aluno Novo (Iniciante)", color: "bg-gray-400" },
    { score: 1, title: "Cordão Cru (Iniciante)", color: "bg-yellow-200" },
    { score: 3, title: "Cordão Amarelo (Estagiário)", color: "bg-yellow-400" },
    { score: 5, title: "Cordão Laranja (Graduado)", color: "bg-orange-400" },
    { score: 8, title: "Cordão Azul (Instrutor)", color: "bg-blue-400" },
    { score: 12, title: "Cordão Verde (Professor)", color: "bg-green-400" },
    { score: 18, title: "Cordão Roxo (Mestre)", color: "bg-purple-400" },
    { score: 25, title: "Cordão Marrom (Contramestre)", color: "bg-amber-600" },
    { score: 35, title: "Cordão Vermelho (Mestre)", color: "bg-red-500" }
  ];

  const getCurrentRank = (userScore: number) => {
    let currentRank = capoeiraRanks[0];
    for (let rank of capoeiraRanks) {
      if (userScore >= rank.score) currentRank = rank;
      else break;
    }
    return currentRank;
  };

  const loadQuestions = useCallback(async () => {
    if (!user) return;
    try {
      const response = await apiFetch('/questions');
      if (response.ok) {
        const data = await response.json();
        setQuestions(Array.isArray(data) ? data : []);
      } else {
        throw new Error('Falha ao carregar as perguntas do servidor.');
      }
    } catch (error: any) {
      console.error('Erro ao carregar perguntas:', error);
      toast({
        title: "Erro de Rede",
        description: error.message || "Não foi possível buscar as perguntas. Verifique sua conexão.",
        variant: "destructive",
      });
    }
  }, [user, toast]);

  const loadConversations = useCallback(async () => {
    if (!user) return;
    try {
      const response = await apiFetch('/chat/conversations');
      if (response.ok) {
        const data = await response.json();
        setConversations(Array.isArray(data) ? data : []);
      } else {
        if (response.status === 404) {
          setConversations([]);
        }
      }
    } catch (error: any) {
      console.error('Erro ao carregar conversas:', error);
      setConversations([]);
    }
  }, [user]);

  useEffect(() => {
    // Wait for auth to finish loading and user to be available
    if (!authLoading && user) {
      setComponentLoading(true);
      loadQuestions().finally(() => setComponentLoading(false));
      loadConversations();
    }
    // If auth is done and there's no user, stop loading.
    if(!authLoading && !user) {
        setComponentLoading(false);
    }
  }, [authLoading, user, loadQuestions, selectedVisibility, selectedTeacher, loadConversations]);

  // Timer effect for the quiz
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isQuizActive && timeLeft > 0 && !showFeedback && !isPaused) {
      timer = setTimeout(() => updateQuizState({ timeLeft: timeLeft - 1 }), 1000);
    } else if (timeLeft === 0 && !showFeedback) {
      handleAnswer();
    }
    return () => clearTimeout(timer);
  }, [timeLeft, isQuizActive, showFeedback, isPaused]);

  const startQuiz = () => {
    let filtered = questions;
    
    // Filtrar por tema
    if (selectedTheme !== "all") {
      filtered = filtered.filter(q => q.theme === selectedTheme);
    }
    
    // Filtrar por visibilidade/fonte
    if (selectedVisibility === "public") {
      // Apenas questões públicas
      filtered = filtered.filter(q => q.visibility === 'public');
    } else if (selectedVisibility === "teachers") {
      // Apenas questões privadas dos professores vinculados
      const teacherIds = relations.map(r => r.teacherId);
      filtered = filtered.filter(q => 
        q.visibility === 'private' && 
        q.createdBy && 
        teacherIds.includes(q.createdBy)
      );
      
      // Se um professor específico foi selecionado, filtrar por ele
      if (selectedTeacher !== "all") {
        filtered = filtered.filter(q => q.createdBy === selectedTeacher);
      }
    }

    if (filtered.length === 0) {
      toast({ title: "Nenhuma pergunta encontrada", description: "Tente uma combinação de filtros diferente.", variant: "destructive" });
      return;
    }

    const shuffled = [...filtered].sort(() => Math.random() - 0.5);
    setQuizQuestions(shuffled);
    updateQuizState({ isQuizActive: true, questionIndex: 0, showFeedback: false, timeLeft: 20, isPaused: false, selectedAnswer: null });
  };

  const handleAnswer = (selectedOptionIndex: number | null = null) => {
    const currentQuestion = quizQuestions[questionIndex];
    if (!currentQuestion) return;

    // Armazenar a resposta selecionada
    const answerIndex = selectedOptionIndex !== null ? selectedOptionIndex : -1;
    
    if (answerIndex === currentQuestion.correctOptionIndex) {
      updateQuizState({ score: score + 1, selectedAnswer: answerIndex, showFeedback: true });
    } else {
      updateQuizState({ selectedAnswer: answerIndex, showFeedback: true });
    }
  };

  const nextQuestion = () => {
    const nextIndex = questionIndex + 1;
    if (nextIndex < quizQuestions.length) {
      updateQuizState({ questionIndex: nextIndex, showFeedback: false, timeLeft: 20, selectedAnswer: null });
    } else {
      endQuiz();
    }
  };

  const endQuiz = () => {
    updateQuizState({ isQuizActive: false });
    const finalRank = getCurrentRank(score);
    toast({ title: "Quiz concluído!", description: `Pontuação: ${score} | Graduação: ${finalRank.title}` });
    // Here you might want to save the final score to the backend
  };

  const pauseQuiz = () => updateQuizState({ isPaused: !isPaused });
  const resetQuiz = () => {
    if (confirm('Tem certeza que deseja resetar o quiz?')) {
      updateQuizState({ isQuizActive: false, questionIndex: 0, score: user?.score || 0 });
      setQuizQuestions([]);
    }
  };

  const themes = [...new Set(questions.map(q => q.theme))];
  const currentRank = getCurrentRank(score);
  const currentQuestion = isQuizActive ? quizQuestions[questionIndex] : null;

  // Show main loading screen while auth is in progress
  if (authLoading || componentLoading) {
    return (
        <div className="min-h-screen bg-gray-50">
            <Header />
            <div className="container mx-auto py-8 px-4 text-center">Carregando dados do aluno...</div>
        </div>
    );
  }

  // If auth is done but there is no user, deny access
  if (!user) {
    return (
        <div className="min-h-screen bg-gray-50">
            <Header />
            <div className="container mx-auto py-8 px-4 text-center text-red-600">Acesso negado. Por favor, faça login.</div>
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="container mx-auto py-4 sm:py-6 lg:py-8 px-4 sm:px-6 lg:px-8 max-w-7xl">
         <div className="mb-4 sm:mb-6 lg:mb-8">
           <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-purple-600 mb-2">
             Área do Aluno
           </h1>
           <p className="text-sm sm:text-base text-gray-600">
             Bem-vindo, {user.nomeCompleto.split(' ')[0]}!
           </p>
         </div>

        <Tabs defaultValue="quiz" className="space-y-4 sm:space-y-6">
          <TabsList className="grid w-full grid-cols-3 h-auto">
             <TabsTrigger value="quiz" className="flex items-center justify-center gap-1 sm:gap-2 text-xs sm:text-sm py-2 sm:py-3">
               <Play className="w-3 h-3 sm:w-4 sm:h-4" />
               <span className="hidden xs:inline">Quiz</span>
             </TabsTrigger>
             <TabsTrigger value="link" className="flex items-center justify-center gap-1 sm:gap-2 text-xs sm:text-sm py-2 sm:py-3">
               <Link className="w-3 h-3 sm:w-4 sm:h-4" />
               <span className="hidden xs:inline">Professores</span>
             </TabsTrigger>
             <TabsTrigger value="chat" className="flex items-center justify-center gap-1 sm:gap-2 text-xs sm:text-sm py-2 sm:py-3">
               <MessageCircle className="w-3 h-3 sm:w-4 sm:h-4" />
               <span className="hidden xs:inline">Chat</span>
             </TabsTrigger>
           </TabsList>

          <TabsContent value="quiz">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          <div className="lg:col-span-1 order-2 lg:order-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-yellow-500" />
                  Seu Progresso
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600">Pontuação Atual</p>
                  <p className="text-2xl font-bold">{score}</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-600 mb-2">Graduação Atual</p>
                  <div className={`p-3 rounded-lg ${currentRank.color} text-white text-center font-semibold`}>
                    {currentRank.title}
                  </div>
                </div>

                <div>
                  <p className="text-sm text-gray-600 mb-2">Progresso para próxima graduação</p>
                  <Progress 
                    value={Math.min((score / (currentRank.score + 3)) * 100, 100)} 
                    className="h-2"
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Sistema de Graduação</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {capoeiraRanks.map((rank, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                      <div className={`w-4 h-4 rounded ${rank.color}`}></div>
                      <span className={score >= rank.score ? 'font-semibold' : 'text-gray-500'}>
                        {rank.title} ({rank.score}+ pontos)
                      </span>
                      {score >= rank.score && <CheckCircle className="w-4 h-4 text-green-500" />}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2 order-1 lg:order-2">
            {!isQuizActive ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                    <Play className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
                    Iniciar Quiz
                  </CardTitle>
                  <CardDescription className="text-sm sm:text-base">
                    Configure seu quiz e escolha as opções de visibilidade
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 sm:space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Fonte das Questões</label>
                    <Select value={selectedVisibility} onValueChange={(value) => updateQuizState({ selectedVisibility: value as string})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Escolha a fonte das questões" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="public">Questões Públicas</SelectItem>
                        {relations.length > 0 && (
                          <SelectItem value="teachers">Professores Vinculados</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  {selectedVisibility === "teachers" && relations.length > 0 && (
                    <div>
                      <label className="text-sm font-medium mb-2 block">Professor</label>
                      <Select value={selectedTeacher} onValueChange={(value) => updateQuizState({ selectedTeacher: value as string})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Escolha um professor" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todos os professores vinculados</SelectItem>
                          {relations.map((relation) => (
                            <SelectItem key={relation.teacherId} value={relation.teacherId}>
                              {relation.teacherName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div>
                    <label className="text-sm font-medium mb-2 block">Tema (opcional)</label>
                    <Select value={selectedTheme} onValueChange={(value) => updateQuizState({ selectedTheme: value as string})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Todos os temas (aleatório)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos os temas (aleatório)</SelectItem>
                        {themes.map(theme => (
                          <SelectItem key={theme} value={theme}>
                            {theme.charAt(0).toUpperCase() + theme.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <Button 
                    onClick={startQuiz}
                    className="w-full bg-purple-600 hover:bg-purple-700"
                    size="lg"
                    disabled={questions.length === 0}
                  >
                    <Play className="w-4 h-4 mr-2" />
                    {questions.length === 0 ? 'Nenhuma Pergunta Carregada' : 'Começar Quiz'}
                  </Button>

                  <div className="text-sm text-gray-600">
                    <p>• Cada pergunta tem 20 segundos para ser respondida</p>
                    <p>• Ganhe 1 ponto por resposta correta</p>
                    <p>• Avance nas graduações da capoeira conforme sua pontuação</p>
                  </div>
                </CardContent>
              </Card>
            ) : currentQuestion && (
              <Card>
                <CardHeader>
                   <CardTitle className="flex items-center justify-between">
                     <span>Pergunta {questionIndex + 1} de {quizQuestions.length}</span>
                     <div className="flex items-center gap-4">
                       <div className="flex items-center gap-2">
                         <Button variant="outline" size="sm" onClick={pauseQuiz} className="flex items-center gap-1">
                           {isPaused ? <Play className="w-3 h-3" /> : <Pause className="w-3 h-3" />}
                           {isPaused ? "Continuar" : "Pausar"}
                         </Button>
                         <Button variant="outline" size="sm" onClick={resetQuiz} className="flex items-center gap-1 text-red-600 hover:text-red-700">
                           <RotateCcw className="w-3 h-3" />
                           Resetar
                         </Button>
                       </div>
                       <div className={`flex items-center gap-2 ${isPaused ? 'text-orange-500' : 'text-red-500'}`}>
                         <Clock className="w-4 h-4" />
                         {timeLeft}s {isPaused && "(Pausado)"}
                       </div>
                     </div>
                   </CardTitle>
                  <Progress value={((questionIndex + 1) / quizQuestions.length) * 100} />
                </CardHeader>
                <CardContent>
                  {!showFeedback ? (
                    <QuizQuestionView 
                        question={currentQuestion}
                        onAnswer={handleAnswer}
                    />
                  ) : (
                    <QuizFeedbackView 
                        question={currentQuestion}
                        selectedAnswer={selectedAnswer !== null ? selectedAnswer : -1}
                        onNext={nextQuestion}
                        isLastQuestion={questionIndex + 1 >= quizQuestions.length}
                    />
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </TabsContent>


          <TabsContent value="link">
            <StudentLinkForm />
          </TabsContent>

          <TabsContent value="chat">
            <Card>
              <CardHeader>
                <CardTitle>Professores para Chat</CardTitle>
                <CardDescription>
                  Professores vinculados e com quem você já conversou
                </CardDescription>
              </CardHeader>
              <CardContent>
                {relations.length === 0 && conversations.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <MessageCircle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <p className="text-lg font-medium mb-2">Nenhuma conversa disponível</p>
                    <p>Vincule-se a professores ou receba uma mensagem para iniciar conversas</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* Professores vinculados */}
                    {relations.map((relation) => {
                      // Verificar se já existe uma conversa com este professor
                      const hasConversation = conversations.some(c => c.partner_id === relation.teacherId);
                      return (
                        <div key={relation.teacherId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex-1">
                            <h4 className="font-medium">{relation.teacherName}</h4>
                            <p className="text-sm text-gray-600">
                              {hasConversation ? 'Professor com conversa ativa' : 'Professor vinculado desde'} {!hasConversation && new Date(relation.createdAt).toLocaleDateString('pt-BR')}
                            </p>
                          </div>
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => {
                              setChattingWith({
                                id: relation.teacherId,
                                name: relation.teacherName,
                                type: 'professor'
                              });
                              setIsChatOpen(true);
                            }}
                            className="bg-purple-600 hover:bg-purple-700"
                          >
                            <MessageCircle className="w-4 h-4 mr-2" />
                            {hasConversation ? 'Abrir Chat' : 'Iniciar Chat'}
                          </Button>
                        </div>
                      );
                    })}
                    
                    {/* Professores com quem já conversou (mas não estão vinculados) */}
                    {conversations
                      .filter(conv => conv.partner_type === 'professor' && !relations.some(r => r.teacherId === conv.partner_id))
                      .map((conversation) => (
                        <div key={conversation.partner_id} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                          <div className="flex-1">
                            <h4 className="font-medium">{conversation.partner_name}</h4>
                            <p className="text-sm text-gray-600">
                              Última mensagem: {conversation.last_message_at ? new Date(conversation.last_message_at).toLocaleDateString('pt-BR') : 'N/A'}
                            </p>
                          </div>
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => {
                              setChattingWith({
                                id: conversation.partner_id,
                                name: conversation.partner_name,
                                type: 'professor'
                              });
                              setIsChatOpen(true);
                            }}
                            className="bg-purple-600 hover:bg-purple-700"
                          >
                            <MessageCircle className="w-4 h-4 mr-2" />
                            Abrir Chat
                          </Button>
                        </div>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <ChatWindow
        isOpen={isChatOpen}
        onClose={() => {
          setIsChatOpen(false);
          setChattingWith(null);
        }}
        onMinimize={() => setIsChatOpen(false)}
        chattingWith={chattingWith}
      />
    </div>
  );
};

// Helper components for better readability

const QuizQuestionView = ({ question, onAnswer }: { question: Question, onAnswer: (index: number) => void }) => {
    const [selectedOption, setSelectedOption] = useState<number | null>(null);

    return (
        <div className="space-y-3 sm:space-y-4">
            <div className="p-3 sm:p-4 bg-purple-50 rounded-lg">
                <p className="text-xs sm:text-sm text-purple-600 font-medium mb-1">
                {question.theme.toUpperCase()}
                </p>
                <h3 className="text-base sm:text-lg font-semibold">
                {question.question}
                </h3>
            </div>
            <div className="space-y-2">
                {question.options.map((option, index) => (
                <Button
                    key={index}
                    variant={selectedOption === index ? "default" : "outline"}
                    className={`w-full text-left p-3 sm:p-4 h-auto justify-start text-sm sm:text-base ${selectedOption === index ? "bg-purple-600 hover:bg-purple-700" : "hover:bg-purple-50"}`}
                    onClick={() => setSelectedOption(index)}
                >
                    <span className="font-semibold mr-2">{String.fromCharCode(65 + index)})</span>
                    <span className="break-words">{option}</span>
                </Button>
                ))}
            </div>
            <Button 
                onClick={() => {
                  if (selectedOption !== null) {
                    onAnswer(selectedOption);
                  }
                }}
                disabled={selectedOption === null}
                className="w-full bg-green-600 hover:bg-green-700 text-sm sm:text-base py-2 sm:py-3"
            >
                Responder
            </Button>
        </div>
    );
}

const QuizFeedbackView = ({ question, selectedAnswer, onNext, isLastQuestion }: { question: Question, selectedAnswer: number, onNext: () => void, isLastQuestion: boolean }) => {
    const isCorrect = selectedAnswer === question.correctOptionIndex;

    return (
        <div className="space-y-3 sm:space-y-4">
            <div className={`p-3 sm:p-4 rounded-lg ${isCorrect ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"} border`}>
                <h3 className="text-base sm:text-lg font-semibold mb-2">
                {isCorrect ? (question.feedback.title || "Correto!") : "Ops, não foi dessa vez!"}
                </h3>
                {question.feedback.illustration && <img src={question.feedback.illustration} alt="Feedback" className="w-full max-w-sm mx-auto mb-3 sm:mb-4 rounded"/>}
                <p className="text-sm sm:text-base">
                {isCorrect ? (question.feedback.text || "Boa resposta!") : `A resposta correta era: "${question.options[question.correctOptionIndex]}". ${question.feedback.text || ""}`}
                </p>
            </div>
            <Button onClick={onNext} className="w-full bg-purple-600 hover:bg-purple-700 text-sm sm:text-base py-2 sm:py-3">
                {isLastQuestion ? "Finalizar Quiz" : "Próxima Pergunta"}
            </Button>
            <QuestionComments
                questionId={question.id}
                questionTheme={question.theme}
                questionText={question.question}
            />
        </div>
    );
}

export default Student;
