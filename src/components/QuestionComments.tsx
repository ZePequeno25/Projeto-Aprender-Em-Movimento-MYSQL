import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useComments } from "@/hooks/useComments";
import { MessageCircle, Send, Reply, User } from "lucide-react";

interface QuestionCommentsProps {
  questionId: string;
  questionTheme: string;
  questionText: string;
}

const QuestionComments = ({ questionId, questionTheme, questionText }: QuestionCommentsProps) => {
  const { user } = useAuth();
  const userId = user?.uid || 'guest';
  
  const [newComment, setNewComment] = useState(() => localStorage.getItem(`newComment_${userId}_${questionId}`) || "");
  const [responseText, setResponseText] = useState(() => localStorage.getItem(`responseText_${userId}_${questionId}`) || "");
  const [respondingTo, setRespondingTo] = useState<string | null>(() => localStorage.getItem(`respondingTo_${userId}_${questionId}`) || null);
  const { comments, loading, addComment, addResponse } = useComments();
  
  useEffect(() => {
    localStorage.setItem(`newComment_${userId}_${questionId}`, newComment);
    localStorage.setItem(`responseText_${userId}_${questionId}`, responseText);
    localStorage.setItem(`respondingTo_${userId}_${questionId}`, respondingTo || '');
  }, [newComment, responseText, respondingTo, userId, questionId]);

  const questionComments = comments.filter(c => c.questionId === questionId);

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    const result = await addComment(questionId, questionTheme, questionText, newComment);
    if (result.success) {
      setNewComment("");
    }
  };

  const handleSubmitResponse = async (commentId: string) => {
    if (!responseText.trim()) return;

    const result = await addResponse(commentId, responseText);
    if (result.success) {
      setResponseText("");
      setRespondingTo(null);
    }
  };

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-blue-500" />
          Comentários sobre esta questão
        </CardTitle>
        <CardDescription>
          Compartilhe suas dúvidas ou observações sobre esta questão
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Formulário para novo comentário */}
        <form onSubmit={handleSubmitComment} className="space-y-3">
          <Textarea
            placeholder="Deixe seu comentário sobre esta questão..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="min-h-[80px]"
          />
          <Button 
            type="submit" 
            disabled={loading || !newComment.trim()}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            <Send className="w-4 h-4 mr-2" />
            {loading ? "Enviando..." : "Enviar Comentário"}
          </Button>
        </form>

        {/* Lista de comentários */}
        <div className="space-y-4">
          {questionComments.length === 0 ? (
            <div className="text-center py-6 text-gray-500">
              <MessageCircle className="w-8 h-8 mx-auto mb-2 text-gray-400" />
              <p>Nenhum comentário ainda. Seja o primeiro!</p>
            </div>
          ) : (
            questionComments.map((comment) => (
              <div key={comment.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-600" />
                    <span className="font-medium">{comment.userName}</span>
                    <Badge variant={comment.userType === 'professor' ? 'default' : 'secondary'}>
                      {comment.userType === 'professor' ? 'Professor' : 'Aluno'}
                    </Badge>
                  </div>
                  <span className="text-sm text-gray-500">
                    {new Date(comment.createdAt).toLocaleDateString('pt-BR')}
                  </span>
                </div>
                
                <p className="text-gray-700">{comment.message}</p>

                {/* Botão para responder */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setRespondingTo(respondingTo === comment.id ? null : comment.id)}
                  className="text-blue-600 hover:text-blue-700"
                >
                  <Reply className="w-4 h-4 mr-1" />
                  Responder
                </Button>

                {/* Formulário de resposta */}
                {respondingTo === comment.id && (
                  <div className="ml-6 space-y-2 pt-2 border-t">
                    <Textarea
                      placeholder="Digite sua resposta..."
                      value={responseText}
                      onChange={(e) => setResponseText(e.target.value)}
                      className="min-h-[60px]"
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleSubmitResponse(comment.id)}
                        disabled={loading || !responseText.trim()}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <Send className="w-3 h-3 mr-1" />
                        Enviar
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setRespondingTo(null);
                          setResponseText("");
                        }}
                      >
                        Cancelar
                      </Button>
                    </div>
                  </div>
                )}

                {/* Respostas ao comentário */}
                {comment.responses && comment.responses.length > 0 && (
                  <div className="ml-6 space-y-3 pt-2 border-t border-gray-200">
                    {comment.responses.map((response) => (
                      <div key={response.id} className="bg-gray-50 rounded p-3">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <User className="w-3 h-3 text-gray-600" />
                            <span className="text-sm font-medium">{response.userName}</span>
                            <Badge 
                              variant={response.userType === 'professor' ? 'default' : 'secondary'}
                              className="text-xs"
                            >
                              {response.userType === 'professor' ? 'Professor' : 'Aluno'}
                            </Badge>
                          </div>
                          <span className="text-xs text-gray-500">
                            {new Date(response.createdAt).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700">{response.message}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default QuestionComments;