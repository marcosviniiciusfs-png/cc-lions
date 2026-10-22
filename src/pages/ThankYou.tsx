import { useEffect } from "react";
import { CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation, useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

interface ThankYouLocationState {
  propertyType?: string;
  metaEventId?: string;
  pixelPayload?: Record<string, string>;
}

const getStoredPixelPayload = () => {
  const storedPixelPayload = sessionStorage.getItem("cc_lions_pixel_payload");

  if (!storedPixelPayload) return null;

  try {
    return JSON.parse(storedPixelPayload) as Record<string, string>;
  } catch {
    return null;
  }
};

const ThankYou = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const state = location.state as ThankYouLocationState | null;
    const propertyType = state?.propertyType || sessionStorage.getItem("cc_lions_property_type") || "";
    const metaEventId = state?.metaEventId || sessionStorage.getItem("cc_lions_meta_event_id") || "";
    const pixelPayload =
      state?.pixelPayload ||
      getStoredPixelPayload() ||
      {
        content_category: propertyType,
        content_name: propertyType,
        tipo_de_bem: propertyType,
        tipo_de_credito: propertyType,
        categoria_credito: propertyType,
      };

    // Track Meta Pixel Lead event on thank you page
    const fbq = window.fbq;
    if (typeof fbq === 'function') {
      if (metaEventId) {
        fbq('track', 'Lead', pixelPayload, { eventID: metaEventId });
      } else {
        fbq('track', 'Lead', pixelPayload);
      }

      console.log('Meta Pixel Lead event tracked', {
        eventId: metaEventId || undefined,
        pixelPayload,
      });
    }
  }, [location.state]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 flex items-center justify-center py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-lg mx-auto text-center">
            <div className="bg-card rounded-2xl shadow-[0_4px_30px_rgba(153,105,18,0.12)] p-10">
              <div className="flex justify-center mb-6">
                <CheckCircle className="w-20 h-20 text-primary" />
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Obrigado!
              </h1>
              <p className="text-lg text-muted-foreground mb-8">
                Sua simulação foi enviada com sucesso! Em breve, um de nossos consultores entrará em contato pelo WhatsApp.
              </p>
              <Button 
                onClick={() => navigate("/")}
                className="py-6 px-8 text-base"
              >
                Voltar ao início
              </Button>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ThankYou;
