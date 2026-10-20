import { useEffect, useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Volume2, VolumeX } from "lucide-react";

const TestimonialsSection = () => {
  const scrollToSimulator = () => {
    const element = document.getElementById("simulador");
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  const videos = ["/videos/1_1.mp4", "/videos/3_1.mp4", "/videos/Design_sem_nome.mp4"];
  const [activeAudioIndex, setActiveAudioIndex] = useState<number | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [loadingStates, setLoadingStates] = useState<boolean[]>([true, true, true]);
  const sectionRef = useRef<HTMLElement>(null);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);

  const handleVideoClick = (index: number) => {
    if (activeAudioIndex === index) {
      setActiveAudioIndex(null);
    } else {
      setActiveAudioIndex(index);
    }
  };

  const toggleMute = (e: React.MouseEvent, index: number) => {
    e.stopPropagation();
    handleVideoClick(index);
  };

  const handleVideoLoaded = useCallback((index: number) => {
    setLoadingStates(prev => {
      const newStates = [...prev];
      newStates[index] = false;
      return newStates;
    });
  }, []);

  // Forçar autoplay quando os vídeos ficarem visíveis (especialmente para mobile)
  useEffect(() => {
    if (isVisible) {
      videoRefs.current.forEach((video) => {
        if (video) {
          video.muted = true;
          video.play().catch(() => {
            // Fallback silencioso se o autoplay falhar
          });
        }
      });
    }
  }, [isVisible]);

  // Controlar mute/unmute quando o usuário clica
  useEffect(() => {
    videoRefs.current.forEach((video, index) => {
      if (video) {
        video.muted = activeAudioIndex !== index;
      }
    });
  }, [activeAudioIndex]);

  // Intersection Observer para lazy loading da seção
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "100px" }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className="py-16 md:py-20 bg-secondary/20">
      <div className="container mx-auto px-4">
        {/* Título e CTA */}
        <div className="text-center mb-12 max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Simule agora gratuitamente e descubra o melhor plano para conquistar o seu sonho
          </h2>
          <p className="text-muted-foreground text-lg mb-6">
            As condições podem mudar a qualquer momento
          </p>
          <Button
            onClick={scrollToSimulator}
            size="lg"
            className="text-lg px-8 py-6 h-auto rounded-lg shadow-lg hover:shadow-xl"
          >
            Quero meu plano ideal →
          </Button>
        </div>

        {/* Grid de 3 Vídeos */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mt-16">
          {videos.map((video, index) => (
            <div
              key={index}
              onClick={() => handleVideoClick(index)}
              className={`relative rounded-2xl overflow-hidden shadow-xl cursor-pointer transition-all duration-300 ${
                activeAudioIndex === index 
                  ? "ring-4 ring-primary scale-[1.02]" 
                  : "hover:scale-[1.01] hover:shadow-2xl"
              }`}
            >
              {isVisible ? (
                <>
                  <video
                    ref={(el) => { videoRefs.current[index] = el; }}
                    src={video}
                    autoPlay
                    muted
                    loop
                    playsInline
                    // @ts-ignore - webkit-playsinline é necessário para iOS
                    webkit-playsinline="true"
                    preload="auto"
                    onCanPlay={() => handleVideoLoaded(index)}
                    onLoadedData={() => handleVideoLoaded(index)}
                    className="w-full h-[400px] md:h-[500px] object-cover"
                  />
                  {loadingStates[index] && (
                    <div className="absolute inset-0 bg-muted flex items-center justify-center">
                      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                </>
              ) : (
                <div className="w-full h-[400px] md:h-[500px] bg-muted flex items-center justify-center">
                  <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              )}
              <button
                onClick={(e) => toggleMute(e, index)}
                className={`absolute bottom-4 right-4 z-10 p-3 rounded-full shadow-lg transition-all hover:scale-110 ${
                  activeAudioIndex === index
                    ? "bg-primary text-primary-foreground"
                    : "bg-black/60 hover:bg-black/80 text-white"
                }`}
                aria-label={activeAudioIndex === index ? "Desativar som" : "Ativar som"}
              >
                {activeAudioIndex === index ? <Volume2 size={20} /> : <VolumeX size={20} />}
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
