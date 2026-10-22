import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import Simulator from "@/components/Simulator";
import BenefitsSection from "@/components/BenefitsSection";
import FinalCtaSection from "@/components/FinalCtaSection";
import Footer from "@/components/Footer";

const Index = () => {
  const scrollToSimulator = () => {
    const element = document.getElementById("simulador");
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-16 md:pt-20">
        <HeroSection onSimulateClick={scrollToSimulator} />
        <Simulator />
        <BenefitsSection />
        <FinalCtaSection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
