import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/hooks/useAuth";
import { useChat } from "@/hooks/useChat"; // Import the new hook
import { MessageCircle, Send, Minimize2, X, User, Loader2 } from "lucide-react";

interface ChatWindowProps {
  isOpen: boolean;
  onClose: () => void;
  onMinimize: () => void;
  chattingWith: {
    id: string;
    name: string;
    type: 'aluno' | 'professor';
  } | null;
}

const ChatWindow = ({ isOpen, onClose, onMinimize, chattingWith }: ChatWindowProps) => {
  const { user } = useAuth();
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Use the new useChat hook
  const { messages, loading, sendMessage: sendChatMessage } = useChat(chattingWith?.id || null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    // Scroll to bottom whenever new messages arrive
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const { success } = await sendChatMessage(newMessage);
    if (success) {
      setNewMessage(""); // Clear input on successful send
    }
  };

  if (!isOpen || !chattingWith) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 w-[calc(100vw-2rem)] sm:w-80 sm:h-96 h-[calc(100vh-8rem)] sm:h-96 z-50 max-w-sm">
      <Card className="h-full shadow-lg border-2 flex flex-col">
        <CardHeader className="p-2 sm:p-3 bg-purple-600 text-white rounded-t-lg">
          <CardTitle className="flex items-center justify-between text-xs sm:text-sm">
            <div className="flex items-center gap-1 sm:gap-2 flex-1 min-w-0">
              <MessageCircle className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
              <span className="truncate">Chat com {chattingWith.name}</span>
              <Badge variant="secondary" className="text-xs flex-shrink-0 hidden sm:inline-flex">
                {chattingWith.type === 'professor' ? 'Professor' : 'Aluno'}
              </Badge>
            </div>
            <div className="flex gap-1 flex-shrink-0">
              <Button variant="ghost" size="sm" onClick={onMinimize} className="h-6 w-6 p-0 text-white hover:bg-purple-700 hidden sm:flex">
                <Minimize2 className="w-3 h-3" />
              </Button>
              <Button variant="ghost" size="sm" onClick={onClose} className="h-6 w-6 p-0 text-white hover:bg-purple-700">
                <X className="w-3 h-3 sm:w-4 sm:h-4" />
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        
        <CardContent className="p-0 flex-1 flex flex-col">
          <ScrollArea className="flex-1 p-3">
            <div className="space-y-3">
              {loading ? (
                <div className="flex items-center justify-center h-full text-gray-500">
                  <Loader2 className="w-6 h-6 animate-spin mr-2" />
                  Carregando histórico...
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  <MessageCircle className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm">Nenhuma mensagem ainda. Inicie a conversa!</p>
                </div>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.senderId === user?.uid ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-[75%] p-2 rounded-lg text-sm break-words ${message.senderId === user?.uid ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-800'}`}>
                      <div className="flex items-center gap-1 mb-1">
                        <User className="w-3 h-3" />
                        <span className="text-xs font-medium">
                          {message.senderId === user?.uid ? 'Você' : message.senderName}
                        </span>
                      </div>
                      <p>{message.message}</p>
                      <p className={`text-xs mt-1 text-right ${message.senderId === user?.uid ? 'text-purple-200' : 'text-gray-500'}`}>
                        {message.createdAt ? new Date(message.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : ''}
                      </p>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          <div className="p-3 border-t">
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <Input
                placeholder="Digite sua mensagem..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                className="flex-1 text-sm"
                disabled={loading}
              />
              <Button type="submit" size="sm" disabled={!newMessage.trim() || loading} className="bg-purple-600 hover:bg-purple-700">
                <Send className="w-3 h-3" />
              </Button>
            </form>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ChatWindow;
