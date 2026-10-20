import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";
import heroBanner from "@/assets/hero-banner.png";

interface HeroSectionProps {
  onSimulateClick: () => void;
}

const HeroSection = ({ onSimulateClick }: HeroSectionProps) => {
  const benefits = [
    "100% Gratuito",
    "Sem consulta ao SPC",
    "Resultado no seu WhatsApp",
  ];

  return (
    <section className="py-16 md:py-24" style={{ backgroundColor: '#e7f3ff' }}>
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Coluna Esquerda - Texto e CTA */}
          <div className="space-y-6">
            <div className="inline-block">
              <p className="text-primary text-sm font-semibold uppercase tracking-wider mb-2">
                + DE 1000 SIMULAÇÕES REALIZADAS
              </p>
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight text-primary">
              Simule agora o seu crédito ideal para conquistar o seu sonho
            </h1>

            {/* Lista de Benefícios */}
            <div className="space-y-3">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-center gap-3">
                  <CheckCircle className="w-6 h-6 text-primary flex-shrink-0" />
                  <span className="text-lg text-foreground font-medium">{benefit}</span>
                </div>
              ))}
            </div>

            {/* Botão de Ação */}
            <div className="pt-4">
              <Button
                onClick={onSimulateClick}
                size="lg"
                className="text-lg px-8 py-6 h-auto rounded-lg shadow-lg hover:shadow-xl transition-all"
              >
                Simular crédito agora →
              </Button>
            </div>
          </div>

          {/* Coluna Direita - Imagem */}
          <div className="relative">
            <div className="relative z-10">
              <img
                src={heroBanner}
                alt="Carros e casa - bens para financiar"
                className="w-full h-auto object-contain drop-shadow-2xl"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
