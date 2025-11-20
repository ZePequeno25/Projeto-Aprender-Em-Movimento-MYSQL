import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetClose, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { AccessibilityButton } from "@/components/AccessibilityButton";
import { LogOut, Home, BookOpen, Users, Settings, Menu, X } from "lucide-react";

const Header = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleNavigation = (path: string) => {
    navigate(path);
    setIsMenuOpen(false);
  };

  const handleLogout = () => {
    logout();
    setIsMenuOpen(false);
  };

  return (
    <header className="bg-purple-600 text-white shadow-lg sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo - sempre visível */}
          <Button 
            variant="ghost" 
            className="text-white hover:bg-purple-700 p-0 h-auto"
            onClick={() => handleNavigation('/')}
          >
            <h1 className="text-xl sm:text-2xl font-bold">Aprender em Movimento</h1>
          </Button>
          
          {/* Desktop Navigation - oculto em mobile */}
          <nav className="hidden md:flex items-center gap-2 lg:gap-4">
            <AccessibilityButton />
            
            <Button 
              variant="ghost" 
              className="text-white hover:bg-purple-700"
              onClick={() => handleNavigation('/')}
            >
              <Home className="w-4 h-4 mr-2" />
              <span className="hidden lg:inline">Início</span>
            </Button>
            
            {user ? (
              <>
                <Button 
                  variant="ghost" 
                  className="text-white hover:bg-purple-700"
                  onClick={() => handleNavigation(user.userType === 'professor' ? '/professor' : '/student')}
                >
                  <BookOpen className="w-4 h-4 mr-2" />
                  <span className="hidden lg:inline">{user.userType === 'professor' ? 'Painel' : 'Quiz'}</span>
                </Button>
                
                <div className="flex items-center gap-2">
                  <span className="text-sm hidden xl:inline">
                    Olá, {user.nomeCompleto.split(' ')[0]}
                  </span>
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={handleLogout}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    <span className="hidden lg:inline">Sair</span>
                  </Button>
                </div>
              </>
            ) : (
              <>
                <Button 
                  variant="ghost" 
                  className="text-white hover:bg-purple-700"
                  onClick={() => handleNavigation('/login')}
                >
                  Login
                </Button>
                <Button 
                  variant="ghost" 
                  className="text-white hover:bg-purple-700"
                  onClick={() => handleNavigation('/register')}
                >
                  Cadastro
                </Button>
              </>
            )}
          </nav>

          {/* Mobile Menu Button - visível apenas em mobile */}
          <div className="flex items-center gap-2 md:hidden">
            <AccessibilityButton />
            <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
              <SheetTrigger asChild>
                <Button 
                  variant="ghost" 
                  className="text-white hover:bg-purple-700 p-2"
                  aria-label="Menu"
                >
                  <Menu className="w-6 h-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[400px] bg-white">
                <SheetTitle className="sr-only">Menu de Navegação</SheetTitle>
                <SheetDescription className="sr-only">
                  Menu principal de navegação do site
                </SheetDescription>
                <div className="flex flex-col gap-4 mt-8">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-gray-900">Menu</h2>
                    <SheetClose asChild>
                      <Button variant="ghost" size="icon" className="text-gray-600" aria-label="Fechar menu">
                        <X className="w-5 h-5" />
                      </Button>
                    </SheetClose>
                  </div>

                  <Button 
                    variant="ghost" 
                    className="justify-start text-gray-700 hover:bg-gray-100"
                    onClick={() => handleNavigation('/')}
                  >
                    <Home className="w-5 h-5 mr-3" />
                    Início
                  </Button>
                  
                  {user ? (
                    <>
                      <Button 
                        variant="ghost" 
                        className="justify-start text-gray-700 hover:bg-gray-100"
                        onClick={() => handleNavigation(user.userType === 'professor' ? '/professor' : '/student')}
                      >
                        <BookOpen className="w-5 h-5 mr-3" />
                        {user.userType === 'professor' ? 'Painel do Professor' : 'Área do Aluno'}
                      </Button>
                      
                      <div className="border-t pt-4 mt-4">
                        <div className="px-4 py-2 text-sm text-gray-600 mb-4">
                          Olá, {user.nomeCompleto.split(' ')[0]}
                        </div>
                        <Button 
                          variant="destructive" 
                          className="w-full justify-start bg-red-600 hover:bg-red-700"
                          onClick={handleLogout}
                        >
                          <LogOut className="w-5 h-5 mr-3" />
                          Sair
                        </Button>
                      </div>
                    </>
                  ) : (
                    <>
                      <Button 
                        variant="outline" 
                        className="justify-start text-gray-700 border-gray-300"
                        onClick={() => handleNavigation('/login')}
                      >
                        Login
                      </Button>
                      <Button 
                        variant="default" 
                        className="justify-start bg-purple-600 hover:bg-purple-700"
                        onClick={() => handleNavigation('/register')}
                      >
                        Cadastro
                      </Button>
                    </>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
