import { MessageCircle, DollarSign, FileText } from "lucide-react";

const BenefitsSection = () => {
  const benefits = [
    {
      icon: MessageCircle,
      title: "Receba direto no WhatsApp",
      description: "Sua simulação de crédito é enviada rapidamente para o seu WhatsApp com todas as informações necessárias."
    },
    {
      icon: DollarSign,
      title: "Parcelas que cabem no seu bolso",
      description: "Encontramos as melhores condições de financiamento com parcelas que se adequam ao seu orçamento."
    },
    {
      icon: FileText,
      title: "Simulação sem compromisso",
      description: "Faça quantas simulações quiser, totalmente grátis e sem consulta ao SPC ou Serasa."
    }
  ];

  return (
    <section id="beneficios" className="py-16 bg-background">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-3 gap-8">
          {benefits.map((benefit, index) => {
            const Icon = benefit.icon;
            return (
              <div
                key={index}
                className="flex flex-col items-center text-center space-y-4 p-6"
              >
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                  <Icon className="w-10 h-10 text-primary" />
                </div>
                <h3 className="text-xl font-bold text-primary">{benefit.title}</h3>
                <p className="text-muted-foreground leading-relaxed">
                  {benefit.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default BenefitsSection;
