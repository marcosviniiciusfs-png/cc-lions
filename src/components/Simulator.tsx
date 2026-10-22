import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { AlertCircle } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface SimulatorData {
  propertyType: string;
  creditAmount: string;
  hasDownPayment: string;
  downPaymentAmount: string;
  monthlyPayment: string;
  city: string;
  fullName: string;
  whatsapp: string;
}

interface LeadWebhookDestination {
  name: string;
  url: string;
  getHeaders?: () => Record<string, string>;
}

const PROPERTY_TYPES = ["Imóvel", "Veículo", "Moto", "Caminhão", "Maquinário", "Embarcação"];
interface ConversionEventPayload {
  eventId: string;
  eventSourceUrl: string;
  leadPayload: Record<string, string>;
  pixelPayload: Record<string, string>;
}

const META_CONVERSIONS_ENDPOINT = import.meta.env.VITE_META_CONVERSIONS_ENDPOINT;
const LEAD_WEBHOOK_DESTINATIONS: LeadWebhookDestination[] = [];

const removeAccents = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
const onlyDigits = (value: string) => value.replace(/\D/g, "");

const formatCurrencyForCrm = (value: string) => {
  const cents = onlyDigits(value);

  if (!cents) return "0";

  const amount = Number(cents) / 100;

  return Number.isInteger(amount) ? String(amount) : amount.toFixed(2);
};

const createMetaEventId = () => {
  const randomId =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

  return `cc-lions-lead-${randomId}`;
};

const sendLeadToDestinations = (payload: Record<string, string>) => {
  console.log("Lead registrado para envio", {
    destinos: LEAD_WEBHOOK_DESTINATIONS.map(({ name }) => name),
  });

  LEAD_WEBHOOK_DESTINATIONS.forEach(({ name, url, getHeaders }) => {
    fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getHeaders?.(),
      },
      body: JSON.stringify(payload),
      keepalive: true,
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        console.log(`Lead enviado para ${name}`, {
          destination: name,
          status: response.status,
        });
      })
      .catch((error) => {
        console.error(`Erro ao enviar lead para ${name}:`, error);
      });
  });
};

const sendConversionEvent = async (payload: ConversionEventPayload) => {
  if (!META_CONVERSIONS_ENDPOINT) {
    throw new Error("Endpoint de conversões não configurado.");
  }

  console.log("Conversao registrada para envio", { eventId: payload.eventId });

  const response = await fetch(META_CONVERSIONS_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
    keepalive: true,
  });
  const responseBody = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(`Meta CAPI HTTP ${response.status}: ${JSON.stringify(responseBody)}`);
  }

  console.log("Conversao enviada para Meta CAPI", {
    status: response.status,
    response: responseBody,
  });
};

const Simulator = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const [formData, setFormData] = useState<SimulatorData>({
    propertyType: "",
    creditAmount: "",
    hasDownPayment: "",
    downPaymentAmount: "",
    monthlyPayment: "",
    city: "",
    fullName: "",
    whatsapp: "",
  });

  const totalSteps = 6;
  const progress = (currentStep / totalSteps) * 100;

  const formatCurrency = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    const formatted = new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(Number(numbers) / 100);
    return formatted;
  };

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    if (numbers.length <= 10) {
      return numbers.replace(/(\d{2})(\d{4})(\d{0,4})/, (_, ddd, p1, p2) =>
        p2 ? `(${ddd}) ${p1}-${p2}` : p1 ? `(${ddd}) ${p1}` : ddd ? `(${ddd}` : ""
      );
    }
    return numbers.replace(/(\d{2})(\d{5})(\d{0,4})/, (_, ddd, p1, p2) =>
      p2 ? `(${ddd}) ${p1}-${p2}` : p1 ? `(${ddd}) ${p1}` : ddd ? `(${ddd}` : ""
    );
  };

  const handleCurrencyChange = (field: keyof SimulatorData, value: string) => {
    setFormData({ ...formData, [field]: formatCurrency(value) });
  };

  const handlePhoneChange = (value: string) => {
    setFormData({ ...formData, whatsapp: formatPhone(value) });
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return formData.propertyType !== "";
      case 2:
        return formData.creditAmount !== "";
      case 3:
        if (formData.hasDownPayment === "") return false;
        if (formData.hasDownPayment === "Sim" && formData.downPaymentAmount === "") return false;
        return true;
      case 4:
        return formData.monthlyPayment !== "";
      case 5:
        return formData.city.trim() !== "";
      case 6:
        return formData.fullName.trim() !== "" && formData.whatsapp.trim() !== "";
      default:
        return false;
    }
  };

  const handleNext = () => {
    setCurrentStep(currentStep + 1);
  };

  const handleBack = () => {
    setCurrentStep(currentStep - 1);
  };

  const handleFinish = async () => {
    if (isSubmitting) return;

    if (!META_CONVERSIONS_ENDPOINT || LEAD_WEBHOOK_DESTINATIONS.length === 0) {
      toast({
        title: "Envio de simulações em configuração",
        description: "A CC Lion's ainda está conectando o atendimento. Nenhum dado foi enviado.",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    
    const creditType = formData.propertyType;
    const creditTypeNormalized = removeAccents(creditType);
    const entryDate = new Date().toISOString().split('T')[0];
    const downPayment = formData.hasDownPayment === "Não" ? "R$ 0,00" : formData.downPaymentAmount;
    const phoneDigits = onlyDigits(formData.whatsapp);
    const metaEventId = createMetaEventId();
    const metaEventSourceUrl = new URL("/obrigado", window.location.href).toString();
    const pixelPayload = {
      content_category: creditType,
      content_name: creditType,
      tipo_de_bem: creditType,
      tipo_de_credito: creditType,
      categoria_credito: creditType,
      valor_do_credito: formData.creditAmount,
      valor_de_entrada: downPayment,
      parcela_ideal: formData.monthlyPayment,
      cidade: formData.city,
    };

    // Payload enviado para todos os destinos de lead.
    const leadPayload = {
      nome: formData.fullName,
      nome_completo: formData.fullName,
      telefone: phoneDigits,
      whatsapp: phoneDigits,
      bem: creditType,
      valor_credito: formatCurrencyForCrm(formData.creditAmount),
      entrada: formatCurrencyForCrm(downPayment),
      parcela: formatCurrencyForCrm(formData.monthlyPayment),
      tipo: creditTypeNormalized,
      interesse: creditTypeNormalized,
      tipo_de_credito: creditTypeNormalized,
      categoria_credito: creditTypeNormalized,
      tipo_de_bem: creditTypeNormalized,
      valor_do_credito: formData.creditAmount,
      valor_de_entrada: pixelPayload.valor_de_entrada,
      parcela_ideal: formData.monthlyPayment,
      cidade: formData.city,
      data_entrada: entryDate,
      "Data de Entrada": entryDate,
      "Nome Completo": formData.fullName,
      "WhatsApp": formData.whatsapp,
      "Tipo de Bem": creditType,
      "Tipo de Crédito": creditType,
      "Categoria do Crédito": creditType,
      "Valor Pretendido (R$)": formData.creditAmount,
      "Valor de Entrada (R$)": pixelPayload.valor_de_entrada,
      "Parcela Ideal (R$)": formData.monthlyPayment,
      "Cidade": formData.city,
    };

    sessionStorage.setItem("cc_lions_property_type", creditType);
    sessionStorage.setItem("cc_lions_pixel_payload", JSON.stringify(pixelPayload));
    sessionStorage.setItem("cc_lions_meta_event_id", metaEventId);

    try {
      // Só exibe a página de obrigado depois de confirmar o envio server-side.
      sendLeadToDestinations(leadPayload);
      await sendConversionEvent({
        eventId: metaEventId,
        eventSourceUrl: metaEventSourceUrl,
        leadPayload,
        pixelPayload,
      });
      navigate("/obrigado", { state: { propertyType: creditType, pixelPayload, metaEventId } });
    } catch (error) {
      console.error("Erro ao enviar conversao para Meta CAPI:", error);
      toast({
        title: "Não foi possível enviar sua simulação",
        description: "Tente novamente em instantes. Seus dados não foram confirmados.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <Label className="text-lg font-semibold text-foreground">
              Qual tipo de bem você deseja adquirir?
            </Label>
            <Select
              value={formData.propertyType}
              onValueChange={(value) => setFormData({ ...formData, propertyType: value })}
            >
              <SelectTrigger className="text-lg p-6 border-2">
                <SelectValue placeholder="Selecione o tipo de bem" />
              </SelectTrigger>
              <SelectContent>
                {PROPERTY_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <Label className="text-lg font-semibold text-foreground">
              Qual o valor do crédito que deseja simular?
            </Label>
            <Input
              type="text"
              placeholder="R$ 0,00"
              value={formData.creditAmount}
              onChange={(e) => handleCurrencyChange("creditAmount", e.target.value)}
              className="text-lg p-6 border-2"
            />
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <Label className="text-lg font-semibold text-foreground">Tem valor de entrada?</Label>
            <div className="grid grid-cols-2 gap-3">
              {["Sim", "Não"].map((option) => (
                <button
                  key={option}
                  onClick={() => setFormData({ ...formData, hasDownPayment: option, downPaymentAmount: option === "Não" ? "" : formData.downPaymentAmount })}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    formData.hasDownPayment === option
                      ? "border-primary bg-primary/10 text-foreground font-semibold"
                      : "border-border hover:border-primary/50 bg-card"
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
            
            {formData.hasDownPayment === "Sim" && (
              <div className="space-y-4 mt-6">
                <Label className="text-lg font-semibold text-foreground">
                  Qual o valor da entrada?
                </Label>
                <Input
                  type="text"
                  placeholder="R$ 0,00"
                  value={formData.downPaymentAmount}
                  onChange={(e) => handleCurrencyChange("downPaymentAmount", e.target.value)}
                  className="text-lg p-6 border-2"
                />
              </div>
            )}
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            <Label className="text-lg font-semibold text-foreground">
              Qual a parcela mensal ideal pra você?
            </Label>
            <Input
              type="text"
              placeholder="R$ 0,00"
              value={formData.monthlyPayment}
              onChange={(e) => handleCurrencyChange("monthlyPayment", e.target.value)}
              className="text-lg p-6 border-2"
            />
          </div>
        );

      case 5:
        return (
          <div className="space-y-4">
            <Label className="text-lg font-semibold text-foreground">
              Qual cidade você reside?
            </Label>
            <Input
              type="text"
              placeholder="Digite sua cidade"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              className="text-lg p-6 border-2"
            />
          </div>
        );

      case 6:
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              <Label className="text-lg font-semibold text-foreground">Nome completo</Label>
              <Input
                type="text"
                placeholder="Digite seu nome completo"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                className="text-lg p-6 border-2"
              />
            </div>
            <div className="space-y-4">
              <Label className="text-lg font-semibold text-foreground">WhatsApp para contato</Label>
              <Input
                type="tel"
                placeholder="(00) 00000-0000"
                value={formData.whatsapp}
                onChange={(e) => handlePhoneChange(e.target.value)}
                className="text-lg p-6 border-2"
                maxLength={15}
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <section id="simulador" className="py-16 md:py-20 bg-secondary/30">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <p className="text-foreground font-semibold text-sm uppercase tracking-wider mb-2">
              SIMULE AGORA
            </p>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
              Responda as perguntas para fazer sua simulação
            </h2>
          </div>

          <div className="bg-card rounded-2xl shadow-[0_4px_30px_rgba(153,105,18,0.12)] p-8 md:p-10">
            {/* Barra de Progresso */}
            <div className="mb-8">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-semibold text-foreground">{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>

            {/* Conteúdo do Step */}
            <div className="mb-8 min-h-[200px]">{renderStep()}</div>

            {/* Mensagem de aviso */}
            {!canProceed() && (
              <div className="flex items-center gap-2 text-accent mb-6 text-sm">
                <AlertCircle className="w-4 h-4" />
                <span>Conclua esse tempo limitado</span>
              </div>
            )}

            {/* Botões de Navegação */}
            <div className="flex gap-3">
              {currentStep > 1 && (
                <Button
                  variant="outline"
                  onClick={handleBack}
                  className="flex-1 py-6 text-base border-2"
                >
                  Voltar
                </Button>
              )}
              {currentStep < totalSteps ? (
                <Button
                  onClick={handleNext}
                  disabled={!canProceed()}
                  className="flex-1 py-6 text-base"
                >
                  Próximo
                </Button>
              ) : (
                <Button
                  onClick={handleFinish}
                  disabled={!canProceed() || isSubmitting}
                  className="flex-1 py-6 text-base"
                >
                  {isSubmitting ? "Enviando..." : "Finalizar"}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Simulator;
