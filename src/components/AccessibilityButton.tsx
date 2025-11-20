import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { useAccessibility } from '@/hooks/useAccessibility';
import { Eye, Minus, Plus, RotateCcw, Type } from 'lucide-react';

export const AccessibilityButton = () => {
  const { fontSize, increaseFontSize, decreaseFontSize, resetFontSize } = useAccessibility();
  const [isOpen, setIsOpen] = useState(false);

  const getFontSizeLabel = () => {
    switch (fontSize) {
      case 'small': return 'Pequeno';
      case 'normal': return 'Normal';
      case 'large': return 'Grande';
      case 'extra-large': return 'Extra Grande';
      default: return 'Normal';
    }
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm"
          className="flex items-center gap-2 text-white hover:bg-purple-700"
          aria-label="Opções de acessibilidade"
        >
          <Eye className="w-4 h-4" />
          <span className="hidden sm:inline">Acessibilidade</span>
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent 
        align="end" 
        className="w-56"
        sideOffset={8}
      >
        <div className="px-3 py-2">
          <p className="text-sm font-medium text-foreground">
            Tamanho do Texto
          </p>
          <p className="text-xs text-muted-foreground">
            Atual: {getFontSizeLabel()}
          </p>
        </div>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem 
          onClick={decreaseFontSize}
          disabled={fontSize === 'small'}
          className="flex items-center gap-2 cursor-pointer"
        >
          <Minus className="w-4 h-4" />
          Diminuir Texto
        </DropdownMenuItem>
        
        <DropdownMenuItem 
          onClick={increaseFontSize}
          disabled={fontSize === 'extra-large'}
          className="flex items-center gap-2 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Aumentar Texto
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem 
          onClick={resetFontSize}
          className="flex items-center gap-2 cursor-pointer"
        >
          <RotateCcw className="w-4 h-4" />
          Restaurar Padrão
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <div className="px-3 py-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Type className="w-3 h-3" />
            Funciona em todas as páginas
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};