import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/Header";
import QuestionnaireUpload from "@/components/QuestionnaireUpload";
import QuestionForm from "@/components/QuestionForm";
import TeacherLinkCode from "@/components/TeacherLinkCode";
import ChatWindow from "@/components/ChatWindow";
import { Users, FileText, BarChart3, Plus, Edit, Link, MessageCircle, Eye } from "lucide-react";
import { apiFetch } from "@/lib/api";

interface Student {
  id: string; // Added for unique key prop
  nomeCompleto: string;
  cpf: string;
  idade: number;
  genero: string;
  corPele: string;
  escolaridade: string;
  telefone: string;
  score: number;
  rank: string;
}

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

// Interface for comments
interface Comment {
  id: string;
  questionId: string;
  questionTheme: string;
  questionText: string;
  userId: string;
  userName: string;
  userType?: 'aluno' | 'professor';
  message: string;
  comment?: string; // Para compatibilidade com código existente
  createdAt: string;
  responses?: Array<{
    id: string;
    userId: string;
    userName: string;
    userType: 'aluno' | 'professor';
    message: string;
    createdAt: string;
  }>;
}

const Professor = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  const [students, setStudents] = useState<Student[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [comments, setComments] = useState<Comment[]>([]); // CORRECT: State for comments
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chattingWith, setChattingWith] = useState<{id: string, name: string, type: 'aluno' | 'professor'} | null>(null);
  const [loading, setLoading] = useState(true);

  // CORRECT: Function to load students
  const loadStudents = useCallback(async () => {
    if (!user) return;
    try {
      const response = await apiFetch('/students_data'); // This endpoint should return students linked to the teacher
      if (response.ok) {
        const data = await response.json();
        setStudents(Array.isArray(data) ? data : []);
      } else {
        throw new Error('Falha ao carregar alunos vinculados');
      }
    } catch (error) {
      console.error('Erro ao carregar estudantes:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados dos estudantes.",
        variant: "destructive",
      });
    }
  }, [user, toast]);

  // CORRECT: Function to load questions created by the teacher
  const loadQuestions = useCallback(async () => {
    if (!user) return;
    try {
      const response = await apiFetch('/questions');
      if (response.ok) {
        const data = await response.json();
        const questionsArray = Array.isArray(data) ? data : [];
        const filteredData = questionsArray.filter((q: Question) => q.createdBy === user.uid);
        setQuestions(filteredData);
      } else {
        throw new Error('Falha ao carregar perguntas');
      }
    } catch (error) {
      console.error('Erro ao carregar perguntas:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as perguntas.",
        variant: "destructive",
      });
    }
  }, [user, toast]);

  // CORRECT: Function to load comments on the teacher's questions
  const loadComments = useCallback(async () => {
    if (!user || !user.uid) return;
    try {
      // Endpoint correto: /teacher-comments/:teacherId
      const response = await apiFetch(`/teacher-comments/${user.uid}`); 
      if (response.ok) {
        const data = await response.json();
        // A resposta vem como {comments: [...]}
        const commentsArray = data.comments || (Array.isArray(data) ? data : []);
        
        // Mapear snake_case do backend para camelCase do frontend
        const mappedComments = commentsArray.map((c: any) => ({
          id: c.id,
          questionId: c.question_id || c.questionId,
          questionTheme: c.question_theme || c.questionTheme,
          questionText: c.question_text || c.questionText,
          userId: c.user_id || c.userId,
          userName: c.user_name || c.userName,
          userType: c.user_type || c.userType,
          message: c.message,
          comment: c.message, // Para compatibilidade com o código existente
          createdAt: c.created_at || c.createdAt,
          responses: (c.responses || []).map((r: any) => ({
            id: r.id,
            userId: r.user_id || r.userId,
            userName: r.user_name || r.userName,
            userType: r.user_type || r.userType,
            message: r.message,
            createdAt: r.created_at || r.createdAt
          }))
        }));
        
        setComments(mappedComments);
      } else {
        // Não mostrar erro para 404, apenas retornar array vazio
        if (response.status === 404) {
          setComments([]);
          return;
        }
        throw new Error('Falha ao carregar comentários');
      }
    } catch (error) {
      console.error('Erro ao carregar comentários:', error);
      // Silenciar erros para não poluir a UI
      setComments([]);
    }
  }, [user, toast]);

  // CORRECT: useEffect to load all necessary data
  useEffect(() => {
    if (user) {
      setLoading(true);
      Promise.all([loadStudents(), loadQuestions(), loadComments()]).finally(() => {
        setLoading(false);
      });
    } else {
        setLoading(false);
    }
  }, [user, loadStudents, loadQuestions, loadComments]);

  const getRank = (score: number) => {
    const ranks = [
        { score: 0, title: "Aluno Novo (Iniciante)" },
        { score: 1, title: "Cordão Cru (Iniciante)" },
        { score: 3, title: "Cordão Amarelo (Estagiário)" },
        { score: 5, title: "Cordão Laranja (Graduado)" },
        { score: 8, title: "Cordão Azul (Instrutor)" },
        { score: 12, title: "Cordão Verde (Professor)" },
        { score: 18, title: "Cordão Roxo (Mestre)" },
        { score: 25, title: "Cordão Marrom (Contramestre)" },
        { score: 35, title: "Cordão Vermelho (Mestre)" }
      ];
  
      let currentRank = ranks[0].title;
      for (let rank of ranks) {
        if (score >= rank.score) currentRank = rank.title;
        else break;
      }
      return currentRank;
  }

  const toggleVisibility = async (questionId: string, currentVisibility: 'public' | 'private') => {
    const newVisibility = currentVisibility === 'public' ? 'private' : 'public';
    try {
      const response = await apiFetch(`/questions/${questionId}/visibility`, {
        method: 'PATCH',
        body: JSON.stringify({ 
          visibility: newVisibility
        })
      });

      if (response.ok) {
        toast({
          title: "Sucesso",
          description: `Questão alterada para ${newVisibility === 'public' ? 'público' : 'privado'}`,
        });
        loadQuestions();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Falha ao alterar visibilidade');
      }
    } catch (error: any) {
      console.error('Erro ao alterar visibilidade:', error);
      toast({
        title: "Erro ao alterar visibilidade",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const deleteQuestion = async (questionId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta pergunta?')) return;

    try {
      const response = await apiFetch(`/questions/${questionId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast({
          title: "Sucesso",
          description: "Pergunta excluída com sucesso",
        });
        loadQuestions();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao excluir pergunta');
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const groupedQuestions = questions.reduce((acc, question) => {
    if (!acc[question.theme]) {
      acc[question.theme] = [];
    }
    acc[question.theme].push(question);
    return acc;
  }, {} as Record<string, Question[]>);

  if (loading && !user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto py-8 px-4 text-center">Carregando...</div>
      </div>
    );
  }
  
  if (!user) {
      return(
        <div className="min-h-screen bg-gray-50">
            <Header />
            <div className="container mx-auto py-8 px-4 text-center text-red-600">Acesso negado. Por favor, faça login.</div>
        </div>
      )
  }

  // Renderização do componente
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="container mx-auto py-4 sm:py-6 lg:py-8 px-4 sm:px-6 lg:px-8 max-w-7xl">
        <div className="mb-4 sm:mb-6 lg:mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-purple-600 mb-2">
            Área do Professor
          </h1>
          <p className="text-sm sm:text-base text-gray-600">
            Bem-vindo, {user.nomeCompleto.split(' ')[0]}! Gerencie seus conteúdos e alunos.
          </p>
        </div>

        <Tabs defaultValue="students" className="space-y-4 sm:space-y-6">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-1 sm:gap-2 h-auto">
            <TabsTrigger value="students" className="flex items-center justify-center gap-1 sm:gap-2 text-xs sm:text-sm py-2 sm:py-3">
              <Users className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Alunos</span>
            </TabsTrigger>
            <TabsTrigger value="add" className="flex items-center justify-center gap-1 sm:gap-2 text-xs sm:text-sm py-2 sm:py-3">
               <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
               <span className="hidden lg:inline">Adicionar Questão</span>
               <span className="hidden sm:inline lg:hidden">Adicionar</span>
             </TabsTrigger>
            <TabsTrigger value="questions" className="flex items-center justify-center gap-1 sm:gap-2 text-xs sm:text-sm py-2 sm:py-3">
              <BarChart3 className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden lg:inline">Minhas Questões</span>
              <span className="hidden sm:inline lg:hidden">Questões</span>
            </TabsTrigger>
            <TabsTrigger value="comments" className="flex items-center justify-center gap-1 sm:gap-2 text-xs sm:text-sm py-2 sm:py-3">
               <MessageCircle className="w-3 h-3 sm:w-4 sm:h-4" />
               <span className="hidden sm:inline">Comentários</span>
             </TabsTrigger>
             <TabsTrigger value="link" className="flex items-center justify-center gap-1 sm:gap-2 text-xs sm:text-sm py-2 sm:py-3">
               <Link className="w-3 h-3 sm:w-4 sm:h-4" />
               <span className="hidden lg:inline">Código de Vínculo</span>
               <span className="hidden sm:inline lg:hidden">Código</span>
             </TabsTrigger>
             <TabsTrigger value="upload" className="flex items-center justify-center gap-1 sm:gap-2 text-xs sm:text-sm py-2 sm:py-3">
               <FileText className="w-3 h-3 sm:w-4 sm:h-4" />
               <span className="hidden sm:inline">Upload XML</span>
             </TabsTrigger>
           </TabsList>
           
          <TabsContent value="students">
            <Card>
              <CardHeader>
                <CardTitle>Alunos Vinculados</CardTitle>
                <CardDescription>
                  {students.length} {students.length === 1 ? 'aluno vinculado' : 'alunos vinculados'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? <p className="text-sm sm:text-base">Carregando alunos...</p> : (
                <div className="overflow-x-auto -mx-4 sm:mx-0">
                  <div className="inline-block min-w-full align-middle">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-xs sm:text-sm">Nome</TableHead>
                          <TableHead className="text-xs sm:text-sm hidden sm:table-cell">Pontuação</TableHead>
                          <TableHead className="text-xs sm:text-sm hidden md:table-cell">Graduação</TableHead>
                          <TableHead className="text-xs sm:text-sm">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {students.map((student) => (
                          <TableRow key={student.id}>
                            <TableCell className="font-medium text-xs sm:text-sm">{student.nomeCompleto}</TableCell>
                            <TableCell className="text-xs sm:text-sm hidden sm:table-cell">{student.score || 0}</TableCell>
                            <TableCell className="text-xs sm:text-sm hidden md:table-cell">{getRank(student.score || 0)}</TableCell>
                            <TableCell>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setChattingWith({
                                    id: student.id, 
                                    name: student.nomeCompleto,
                                    type: 'aluno'
                                  });
                                  setIsChatOpen(true);
                                }}
                                className="text-xs sm:text-sm"
                              >
                                <MessageCircle className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                                <span className="hidden sm:inline">Chat</span>
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  
                  {students.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <Users className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                      <p className="text-lg font-medium mb-2">Nenhum aluno vinculado</p>
                      <p>Compartilhe seu código de vínculo para que os alunos possam se conectar.</p>
                    </div>
                  )}
                </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="add">
            <QuestionForm mode="create" onSuccess={loadQuestions} />
          </TabsContent>

          <TabsContent value="questions">
            <Card>
              <CardHeader>
                <CardTitle>Minhas Questões</CardTitle>
                <CardDescription>
                  {questions.length} perguntas em {Object.keys(groupedQuestions).length} temas criados por você
                </CardDescription>
              </CardHeader>
              <CardContent>
              {loading ? <p>Carregando questões...</p> : (
                <div className="space-y-6">
                  {Object.entries(groupedQuestions).map(([theme, themeQuestions]) => (
                    <div key={theme} className="border rounded-lg p-4">
                      <h3 className="text-lg font-semibold text-purple-600 mb-3 capitalize">
                        {theme} ({themeQuestions.length} perguntas)
                      </h3>
                      <div className="space-y-2">
                         {themeQuestions.map((question) => (
                          <div key={question.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-3 bg-gray-50 rounded gap-2">
                            <div className="flex-1">
                              <p className="font-medium">{question.question}</p>
                              <div className="text-sm text-gray-600 flex items-center gap-2">
                                <span>Visibilidade:</span>
                                <Badge 
                                  variant={question.visibility === 'public' ? 'default' : 'secondary'}
                                  className="cursor-pointer hover:opacity-80 transition-opacity"
                                  onClick={() => toggleVisibility(question.id, question.visibility)}
                                >
                                  <Eye className="w-3 h-3 mr-1" />
                                  {question.visibility === 'public' ? 'Público' : 'Privado'}
                                </Badge>
                              </div>
                            </div>
                            <div className="flex gap-2 mt-2 sm:mt-0">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setEditingQuestion(question)}
                              >
                                <Edit className="w-4 h-4 mr-1" />
                                Editar
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => deleteQuestion(question.id)}
                              >
                                Excluir
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                  
                  {Object.keys(groupedQuestions).length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                        <BarChart3 className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                        <p className="text-lg font-medium mb-2">Nenhuma questão criada</p>
                        <p>Adicione questões manualmente ou faça upload de um arquivo XML.</p>
                    </div>
                  )}
                </div>
                )}
                 {editingQuestion && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
                        <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-full overflow-y-auto">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold">Editando Questão</h3>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setEditingQuestion(null)}
                                >
                                    Fechar
                                </Button>
                            </div>
                            <QuestionForm
                                mode="edit"
                                question={editingQuestion}
                                onSuccess={() => {
                                    loadQuestions();
                                    setEditingQuestion(null);
                                }}
                            />
                        </div>
                    </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="comments">
            <Card>
              <CardHeader>
                <CardTitle>Comentários dos Alunos</CardTitle>
                <CardDescription>
                  Visualize e responda aos comentários sobre suas questões.
                </CardDescription>
              </CardHeader>
              <CardContent>
              {loading ? <p>Carregando comentários...</p> : (
                <>
                {comments.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <MessageCircle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <p className="text-lg font-medium mb-2">Nenhum comentário ainda</p>
                    <p>Os comentários dos seus alunos aparecerão aqui.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {comments.map((comment) => (
                      <div key={comment.id} className="border rounded-lg p-4 bg-gray-50">
                         <div className="flex items-start justify-between mb-3">
                           <div>
                             <h4 className="font-medium text-purple-600">{comment.questionTheme || 'Tema Desconhecido'}</h4>
                             <p className="text-sm text-gray-600 mb-2">Questão: "{comment.questionText || 'Não especificada'}"</p>
                             <div className="flex items-center gap-2">
                               <Badge variant="secondary">{comment.userName || 'Usuário Desconhecido'}</Badge>
                               <span className="text-xs text-gray-500">
                                {comment.createdAt ? new Date(comment.createdAt).toLocaleDateString('pt-BR') : 'Data desconhecida'}
                              </span>
                            </div>
                          </div>
                          <Button
                            variant="default"
                            size="sm"
                            className="bg-purple-600 hover:bg-purple-700"
                            onClick={() => {
                               setChattingWith({
                                id: comment.userId,
                                name: comment.userName,
                                type: 'aluno'
                              });
                               setIsChatOpen(true);
                            }}
                          >
                            <MessageCircle className="w-4 h-4 mr-1" />
                            Responder
                          </Button>
                        </div>
                        <p className="text-gray-800 bg-white p-3 rounded-md shadow-sm">{comment.message || comment.comment}</p>
                      </div>
                    ))}
                  </div>
                )}
                </>
              )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="link">
            <TeacherLinkCode />
          </TabsContent>

          <TabsContent value="upload">
            <QuestionnaireUpload onSuccess={loadQuestions} />
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

export default Professor;
