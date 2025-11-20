import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Upload, FileText } from "lucide-react";
import { apiFetch } from "@/lib/api";

// Define the types for the component's props
interface QuestionnaireUploadProps {
  onSuccess: () => void; // Expect a function that returns nothing
}

const QuestionnaireUpload = ({ onSuccess }: QuestionnaireUploadProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.name.endsWith('.xml')) {
        toast({
          title: "Arquivo inválido",
          description: "Por favor, selecione um arquivo XML",
          variant: "destructive",
        });
        return;
      }
      setFile(selectedFile);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast({
        title: "Nenhum arquivo selecionado",
        description: "Por favor, selecione um arquivo XML antes de enviar",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      // apiFetch handles the authentication token automatically
      const response = await apiFetch('/upload_questions_xml', {
        method: 'POST',
        body: formData, // For FormData, apiFetch and browser will set the correct Content-Type
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao enviar arquivo');
      }
      
      toast({
        title: "Upload realizado com sucesso!",
        description: data.message,
      });

      // Call the callback function provided by the parent component
      if (onSuccess) {
        onSuccess();
      }

      // Clear the selected file
      setFile(null);
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      if (input) input.value = '';

    } catch (error: any) {
      console.error('Erro no upload:', error);
      toast({
        title: "Erro no upload",
        description: error.message || "Erro ao enviar arquivo XML",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4 p-6 border rounded-lg bg-white shadow-sm">
      <div className="flex items-center gap-2">
        <FileText className="w-5 h-5 text-purple-600" />
        <h3 className="text-lg font-semibold">Upload de Questionário XML</h3>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="xml-file">Selecione o arquivo XML</Label>
        <Input
          id="xml-file"
          type="file"
          accept=".xml"
          onChange={handleFileChange}
          disabled={uploading}
        />
        {file && (
          <p className="text-sm text-muted-foreground">
            Arquivo selecionado: {file.name}
          </p>
        )}
      </div>

      <Button 
        onClick={handleUpload}
        disabled={!file || uploading}
        className="w-full bg-purple-600 hover:bg-purple-700"
      >
        <Upload className="w-4 h-4 mr-2" />
        {uploading ? 'Enviando...' : 'Enviar XML'}
      </Button>

      <div className="text-sm text-muted-foreground">
        <p><strong>Formato esperado do XML:</strong></p>
        <pre className="bg-gray-100 p-2 rounded mt-2 text-xs overflow-x-auto">
{`<root>
  <theme name="tecnologia">
    <question>
      <text>Qual é a linguagem de programação?</text>
      <option>Python</option>
      <option>Java</option>
      <option>JavaScript</option>
      <correct>0</correct>
      <feedback-title>Correto!</feedback-title>
      <feedback-text>Python é uma linguagem versátil</feedback-text>
      <feedback-illustration>https://example.com/image.jpg</feedback-illustration>
    </question>
  </theme>
</root>`}
        </pre>
      </div>
    </div>
  );
};

export default QuestionnaireUpload;
