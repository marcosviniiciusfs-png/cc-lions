import { Phone, MapPin } from "lucide-react";

const Footer = () => {
  return (
    <footer id="contato" className="bg-primary text-primary-foreground">
      <div className="container mx-auto px-4 py-12">
        <div className="grid md:grid-cols-3 gap-8 mb-8">
          <div>
            <h3 className="text-xl font-bold mb-4">CC Lion's</h3>
            <p className="text-primary-foreground/80">Simulador de crédito</p>
          </div>

          <div>
            <h3 className="text-xl font-bold mb-4">Fale conosco</h3>
            <div className="flex items-start gap-3">
              <Phone className="w-5 h-5 mt-1 flex-shrink-0" />
              <p className="text-primary-foreground/80">WhatsApp a configurar</p>
            </div>
          </div>

          <div>
            <h3 className="text-xl font-bold mb-4">Localização</h3>
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 mt-1 flex-shrink-0" />
              <p className="text-primary-foreground/80">Endereço a configurar</p>
            </div>
          </div>
        </div>

        <div className="border-t border-primary-foreground/20 pt-6 text-center">
          <p className="text-primary-foreground/90 text-sm">© CC Lion's. Todos os direitos reservados.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
