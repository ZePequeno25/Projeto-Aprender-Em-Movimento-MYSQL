import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate, useSearchParams } from "react-router-dom";
import Header from "@/components/Header";
import { useToast } from "@/hooks/use-toast";
import { apiFetch } from "@/lib/api";

const ResetPassword = () => {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  // ✅ CORREÇÃO: Usar userId em vez de cpf/userType
  const userId = searchParams.get('userId');

  useEffect(() => {
    if (!userId) {
      toast({
        title: "Erro",
        description: "Dados inválidos. Redirecionando...",
        variant: "destructive"
      });
      navigate('/forgot-password');
    }
  }, [userId, navigate, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('🔐 [ResetPassword] Iniciando reset...', { userId });

    if (newPassword !== confirmPassword) {
      toast({
        title: "Erro",
        description: "As senhas não coincidem",
        variant: "destructive"
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: "Erro",
        description: "A senha deve ter pelo menos 6 caracteres",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    
    try {
      console.log('🌐 [ResetPassword] Chamando API...');
      
      const response = await apiFetch('/reset_password', { // ou /reset_password
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId, // ✅ CORREÇÃO: Enviar userId em vez de cpf/userType
          newPassword 
        })
      });

      console.log('📨 [ResetPassword] Resposta:', {
        status: response.status,
        ok: response.ok
      });

      const data = await response.json();
      console.log('📊 [ResetPassword] Dados:', data);

      // ✅ CORREÇÃO: Backend retorna { message } não { success }
      if (response.ok) {
        toast({
          title: "Sucesso",
          description: data.message || "Senha alterada com sucesso!"
        });
        navigate('/login');
      } else {
        throw new Error(data.error || "Erro ao alterar senha");
      }

    } catch (error: any) {
      console.error('💥 [ResetPassword] Erro:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao alterar senha. Tente novamente.",
        variant: "destructive"
      });
    }
    
    setLoading(false);
  };

  if (!userId) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-md mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl text-center text-primary">
                Nova Senha
              </CardTitle>
              <CardDescription className="text-center">
                Digite sua nova senha
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="newPassword">Nova Senha</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    placeholder="Digite sua nova senha"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmar Senha</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Confirme sua nova senha"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={loading}
                >
                  {loading ? "Alterando..." : "Alterar Senha"}
                </Button>

                <div className="text-center">
                  <Button 
                    variant="link" 
                    onClick={() => navigate('/login')}
                    className="text-primary"
                  >
                    Voltar ao login
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;