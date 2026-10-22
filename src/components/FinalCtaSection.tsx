import { Button } from "@/components/ui/button";

const FinalCtaSection = () => {
  const scrollToSimulator = () => {
    const element = document.getElementById("simulador");
    element?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="bg-secondary/30 py-16 md:py-20">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="mb-4 text-3xl font-bold text-foreground md:text-4xl">
            Simule agora gratuitamente e descubra o melhor plano para conquistar o seu sonho
          </h2>
          <p className="mb-6 text-lg text-muted-foreground">
            As condições podem mudar a qualquer momento
          </p>
          <Button
            onClick={scrollToSimulator}
            size="lg"
            className="h-auto rounded-lg px-8 py-6 text-lg shadow-lg hover:shadow-xl"
          >
            Quero meu plano ideal →
          </Button>
        </div>
      </div>
    </section>
  );
};

export default FinalCtaSection;
