import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Save } from "lucide-react";
import { apiFetch } from "@/lib/api";

// Match the interface from the Professor page
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

interface QuestionFormProps {
  question?: Question | null; // Allow null for resetting
  onSuccess: () => void;
  mode: 'create' | 'edit';
}

const QuestionForm = ({ question, onSuccess, mode }: QuestionFormProps) => {
  // State management using useEffect to react to prop changes, especially in edit mode
  const [theme, setTheme] = useState('');
  const [questionText, setQuestionText] = useState('');
  const [options, setOptions] = useState<string[]>(['', '']);
  const [correctOptionIndex, setCorrectOptionIndex] = useState(0);
  const [feedbackTitle, setFeedbackTitle] = useState('');
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackIllustration, setFeedbackIllustration] = useState('');
  const [loading, setLoading] = useState(false);

  const { toast } = useToast();

  useEffect(() => {
    if (mode === 'edit' && question) {
        setTheme(question.theme ?? '');
        setQuestionText(question.question ?? '');
        setOptions(Array.isArray(question.options) && question.options.length > 0 ? question.options : ['', '']);
        setCorrectOptionIndex(question.correctOptionIndex ?? 0);
        setFeedbackTitle(question.feedback?.title ?? '');
        setFeedbackText(question.feedback?.text ?? '');
        setFeedbackIllustration(question.feedback?.illustration ?? '');
    } else {
        // Reset form for 'create' mode or if question is null
        setTheme('');
        setQuestionText('');
        setOptions(['', '']);
        setCorrectOptionIndex(0);
        setFeedbackTitle('');
        setFeedbackText('');
        setFeedbackIllustration('');
    }
  }, [question, mode]);

  const addOption = () => {
    setOptions([...options, '']);
  };

  const removeOption = (index: number) => {
    if (options.length > 2) {
      const newOptions = options.filter((_, i) => i !== index);
      setOptions(newOptions);
      if (correctOptionIndex >= newOptions.length) {
        setCorrectOptionIndex(newOptions.length - 1);
      }
    }
  };

  const updateOption = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!theme.trim() || !questionText.trim() || options.some(opt => !opt.trim())) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha o tema, a pergunta e todas as opções de resposta.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Garantir que feedback.title e feedback.text não sejam vazios (backend exige)
      const questionData = {
        theme,
        question: questionText,
        options,
        correctOptionIndex,
        feedback: {
          title: feedbackTitle.trim() || 'Feedback', // Se vazio, usar valor padrão
          text: feedbackText.trim() || 'Continue praticando!', // Se vazio, usar valor padrão
          illustration: feedbackIllustration.trim() || ''
        },
        // No need to send createdBy, the backend should associate it with the authenticated user
      };

      const url = mode === 'create' 
        ? '/questions'
        : `/questions/${question?.id}`;

      const method = mode === 'create' ? 'POST' : 'PUT';

      const response = await apiFetch(url, {
        method,
        body: JSON.stringify(questionData)
      });

      if (response.ok) {
        toast({
          title: "Sucesso!",
          description: `Questão ${mode === 'create' ? 'criada' : 'atualizada'} com sucesso.`,
        });
        
        onSuccess(); // Always call onSuccess callback

      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Falha ao salvar a questão');
      }
    } catch (error: any) {
      toast({
        title: "Erro ao Salvar",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {mode === 'create' ? 'Criar Nova Questão' : 'Editar Questão'}
        </CardTitle>
        <CardDescription>
          {mode === 'create' 
            ? 'Preencha os campos para adicionar uma nova questão ao acervo.'
            : 'Modifique os dados da questão selecionada.'
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="theme">Tema *</Label>
            <Input
              id="theme"
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              placeholder="Ex: Gramática, Ortografia..."
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="question">Pergunta *</Label>
            <Textarea
              id="question"
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              placeholder="Digite o enunciado da questão"
              required
            />
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Opções de Resposta *</Label>
              <Button type="button" onClick={addOption} size="sm" variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Opção
              </Button>
            </div>
            
            {options.map((option, index) => (
              <div key={index} className="flex gap-2 items-center">
                <Input
                  value={option}
                  onChange={(e) => updateOption(index, e.target.value)}
                  placeholder={`Opção ${index + 1}`}
                  required
                />
                {options.length > 2 && (
                  <Button
                    type="button"
                    onClick={() => removeOption(index)}
                    size="sm"
                    variant="destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>

          {options.length > 0 && (
             <div className="space-y-2">
                <Label>Resposta Correta *</Label>
                <Select value={correctOptionIndex.toString()} onValueChange={(value) => setCorrectOptionIndex(parseInt(value, 10))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a resposta correta" />
                  </SelectTrigger>
                  <SelectContent>
                    {options.map((option, index) => (
                      <SelectItem key={index} value={index.toString()}>
                        {`Opção ${index + 1}: ${option.substring(0, 50)}${option.length > 50 ? '...' : ''}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
          )}

          <div className="border-t pt-6">
              <h4 className="text-md font-semibold mb-2">Feedback da Resposta</h4>
              <div className="space-y-2">
                <Label htmlFor="feedbackTitle">Título do Feedback (opcional)</Label>
                <Input
                id="feedbackTitle"
                value={feedbackTitle}
                onChange={(e) => setFeedbackTitle(e.target.value)}
                placeholder="Ex: Correto!, Quase lá!, Tente novamente!"
                />
            </div>
            <div className="space-y-2 mt-4">
                <Label htmlFor="feedbackText">Texto do Feedback (opcional)</Label>
                <Textarea
                id="feedbackText"
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                placeholder="Explicação detalhada sobre a resposta e o conteúdo."
                />
            </div>
             <div className="space-y-2 mt-4">
                <Label htmlFor="feedbackIllustration">URL da Ilustração (opcional)</Label>
                <Input
                id="feedbackIllustration"
                value={feedbackIllustration}
                onChange={(e) => setFeedbackIllustration(e.target.value)}
                placeholder="https://exemplo.com/imagem_explicativa.jpg"
                type="url"
                />
            </div>
          </div>

          <Button type="submit" disabled={loading} className="w-full bg-purple-600 hover:bg-purple-700">
            <Save className="w-4 h-4 mr-2" />
            {loading ? 'Salvando...' : (mode === 'create' ? 'Criar Questão' : 'Salvar Alterações')}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default QuestionForm;
