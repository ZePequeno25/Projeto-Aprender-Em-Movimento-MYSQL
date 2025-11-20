import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTeacherStudent } from "@/hooks/useTeacherStudent";
import { Copy, Link, Users, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const TeacherLinkCode = () => {
  const { relations, teacherCode, generateTeacherCode, unlinkStudent } = useTeacherStudent();
  const { toast } = useToast();

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(teacherCode);
      toast({
        title: "Código copiado!",
        description: "O código foi copiado para a área de transferência"
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao copiar código",
        variant: "destructive"
      });
    }
  };

  const generateNewCode = async () => {
    if (confirm('Tem certeza? O código anterior será invalidado e todos os alunos precisarão usar o novo código.')) {
      await generateTeacherCode();
      toast({
        title: "Novo código gerado!",
        description: "Compartilhe o novo código com seus alunos"
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Código do Professor */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link className="w-5 h-5 text-purple-500" />
            Seu Código de Vinculação
          </CardTitle>
          <CardDescription>
            Compartilhe este código com seus alunos para que eles possam se vincular a você
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="teacher-code">Código Único</Label>
            <div className="flex gap-2 mt-1">
              <Input
                id="teacher-code"
                type="text"
                value={teacherCode}
                readOnly
                className="font-mono text-center text-lg font-bold"
              />
              <Button 
                variant="outline" 
                size="icon"
                onClick={copyToClipboard}
                title="Copiar código"
              >
                <Copy className="w-4 h-4" />
              </Button>
              <Button 
                variant="outline" 
                size="icon"
                onClick={generateNewCode}
                title="Gerar novo código"
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <div className="text-sm text-gray-600 p-3 bg-blue-50 rounded">
            <p className="font-medium mb-1">Instruções para os alunos:</p>
            <p>1. Faça login na conta de aluno</p>
            <p>2. Vá na seção "Vincular Professor"</p>
            <p>3. Digite o código: <span className="font-mono font-bold">{teacherCode}</span></p>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Alunos Vinculados */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-green-500" />
            Alunos Vinculados ({relations.length})
          </CardTitle>
          <CardDescription>
            Lista de alunos que estão vinculados a você
          </CardDescription>
        </CardHeader>
        <CardContent>
          {relations.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Users className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="text-lg font-medium mb-2">Nenhum aluno vinculado ainda</p>
              <p>Compartilhe seu código de vinculação com os alunos</p>
            </div>
          ) : (
            <div className="space-y-3">
              {relations.map((relation) => (
                <div key={relation.studentId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium">{relation.studentName}</h4>
                    <p className="text-sm text-gray-600">
                      Vinculado em: {new Date(relation.createdAt).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => unlinkStudent(relation.studentId)}
                    className="text-red-600 hover:text-red-700"
                  >
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

export default TeacherLinkCode;