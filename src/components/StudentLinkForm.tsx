import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useTeacherStudent } from "@/hooks/useTeacherStudent";
import { useToast } from "@/hooks/use-toast";
import { Link, UserPlus, X } from "lucide-react";

const StudentLinkForm = () => {
  const [code, setCode] = useState("");
  const { relations, loading, linkStudentToTeacher } = useTeacherStudent();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;
    
    const result = await linkStudentToTeacher(code.trim().toUpperCase());
    if (result.success) {
      setCode("");
    }
  };

  return (
    <div className="space-y-6">
      {/* Formulário para vincular a um professor */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-blue-500" />
            Vincular-se a um Professor
          </CardTitle>
          <CardDescription>
            Digite o código fornecido pelo seu professor para se vincular
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="teacher-code">Código do Professor</Label>
              <Input
                id="teacher-code"
                type="text"
                placeholder="Ex: PROF_ABC12345"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                className="mt-1"
              />
            </div>
            <Button 
              type="submit" 
              disabled={loading || !code.trim()}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {loading ? "Vinculando..." : "Vincular-se ao Professor"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Lista de professores vinculados */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link className="w-5 h-5 text-green-500" />
            Professores Vinculados ({relations.length})
          </CardTitle>
          <CardDescription>
            Lista de professores aos quais você está vinculado
          </CardDescription>
        </CardHeader>
        <CardContent>
          {relations.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <UserPlus className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="text-lg font-medium mb-2">Nenhum professor vinculado</p>
              <p>Use o formulário acima para se vincular a um professor</p>
            </div>
          ) : (
            <div className="space-y-3">
              {relations.map((relation) => (
                <div key={relation.teacherId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium">{relation.teacherName}</h4>
                    <p className="text-sm text-gray-600">
                      Vinculado em: {new Date(relation.createdAt).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      // Para alunos, precisamos buscar o relationId primeiro
                      // Como o unlinkStudent é para professores, vamos criar uma função específica para alunos
                      // Por enquanto, vamos apenas mostrar uma mensagem
                      toast({
                        title: 'Ação não disponível',
                        description: 'Entre em contato com o professor para desvincular',
                        variant: 'destructive',
                      });
                    }}
                    className="text-red-600 hover:text-red-700"
                  >
                    <X className="w-4 h-4" />
                    Desvincular
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default StudentLinkForm;