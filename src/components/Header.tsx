import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
      setIsMenuOpen(false);
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-primary shadow-md">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-primary-foreground font-bold text-xl md:text-2xl">CC Lion's</span>
        </div>

        {/* Desktop Menu */}
        <nav className="hidden md:flex items-center gap-6">
          <button
            onClick={() => scrollToSection("inicio")}
            className="text-primary-foreground/90 hover:text-primary-foreground transition-colors font-medium"
          >
            Início
          </button>
          <button
            onClick={() => scrollToSection("simulador")}
            className="text-primary-foreground/90 hover:text-primary-foreground transition-colors font-medium"
          >
            Simulador
          </button>
          <button
            onClick={() => scrollToSection("beneficios")}
            className="text-primary-foreground/90 hover:text-primary-foreground transition-colors font-medium"
          >
            Benefícios
          </button>
          <button
            onClick={() => scrollToSection("contato")}
            className="text-primary-foreground/90 hover:text-primary-foreground transition-colors font-medium"
          >
            Contato
          </button>
        </nav>

        {/* Mobile Menu Button */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden text-primary-foreground hover:bg-primary-foreground/10"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </Button>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-primary border-t border-primary-foreground/20">
          <nav className="container mx-auto px-4 py-4 flex flex-col gap-4">
            <button
              onClick={() => scrollToSection("inicio")}
              className="text-primary-foreground/90 hover:text-primary-foreground transition-colors text-left py-2 font-medium"
            >
              Início
            </button>
            <button
              onClick={() => scrollToSection("simulador")}
              className="text-primary-foreground/90 hover:text-primary-foreground transition-colors text-left py-2 font-medium"
            >
              Simulador
            </button>
            <button
              onClick={() => scrollToSection("beneficios")}
              className="text-primary-foreground/90 hover:text-primary-foreground transition-colors text-left py-2 font-medium"
            >
              Benefícios
            </button>
            <button
              onClick={() => scrollToSection("contato")}
              className="text-primary-foreground/90 hover:text-primary-foreground transition-colors text-left py-2 font-medium"
            >
              Contato
            </button>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;
