import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Loader2, Sparkles, Zap, Globe, Shield, Image as ImageIcon, Brain } from "lucide-react";
import { SEO } from "@/components/SEO";

const Landing = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (user && !loading) {
      navigate('/chat');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background overflow-hidden relative">
      {/* Gradient backgrounds */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-secondary/10 rounded-full blur-3xl" />
      </div>

      <SEO
        title="OnyxGPT: 500+ AI Models | ChatGPT & Claude Alternative"
        description="Access 500+ AI models with higher rate limits than ChatGPT. All ChatGPT features plus vision, image generation, and web search. A powerful OpenAI, Claude, Perplexity alternative."
        canonical="https://f65a04f8-7aee-4309-9141-8488d933011b.lovableproject.com/"
        keywords={["OpenAI", "ChatGPT alternative", "Claude alternative", "Perplexity alternative", "AI chat", "AI models", "higher rate limits"]}
      />
      
      <div className="relative z-10 container mx-auto px-4 py-12 md:py-16 lg:py-20">
        <div className="text-center space-y-8 md:space-y-12 animate-fade-in">
          {/* Hero Section */}
          <div className="space-y-6 max-w-5xl mx-auto">
            <div className="inline-block mb-4">
              <span className="px-4 py-2 rounded-full bg-primary/20 text-primary text-sm font-semibold border border-primary/30">
                ✨ Powered by 500+ AI Models
              </span>
            </div>
            
            <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent animate-gradient">
              Meet Your AI Co-Pilot
            </h1>
            
            <p className="text-xl md:text-2xl text-foreground/90 max-w-4xl mx-auto font-medium">
              Access ChatGPT, Claude, Gemini, and 500+ more AI models in one unified interface
            </p>

            <p className="text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Higher rate limits than ChatGPT. Plus vision, image generation, web search, and more
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex gap-4 justify-center flex-wrap pt-4">
            <Button
              size="lg"
              onClick={() => navigate("/auth")}
              className="text-lg px-8 py-6 shadow-lg hover:shadow-xl transition-all duration-300 glow-primary-strong hover:scale-105"
            >
              <Sparkles className="w-5 h-5 mr-2" />
              Get Started Free
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate("/chat")}
              className="text-lg px-8 py-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
            >
              Try as Guest
            </Button>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto mt-20">
            <div className="group bg-card/40 backdrop-blur border border-border/50 rounded-2xl p-8 hover:border-primary/50 transition-all duration-300 hover:glow-primary animate-scale-in hover:-translate-y-2">
              <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center mb-4 group-hover:bg-primary/30 transition-colors">
                <Brain className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-2 text-foreground">Advanced Reasoning</h3>
              <p className="text-muted-foreground">GPT-5, Claude Sonnet, Gemini, DeepSeek R1 and more</p>
            </div>

            <div className="group bg-card/40 backdrop-blur border border-border/50 rounded-2xl p-8 hover:border-secondary/50 transition-all duration-300 hover:glow-secondary animate-scale-in hover:-translate-y-2" style={{ animationDelay: '0.1s' }}>
              <div className="w-12 h-12 rounded-xl bg-secondary/20 flex items-center justify-center mb-4 group-hover:bg-secondary/30 transition-colors">
                <Zap className="w-6 h-6 text-secondary" />
              </div>
              <h3 className="text-xl font-bold mb-2 text-foreground">Lightning Fast</h3>
              <p className="text-muted-foreground">Instant responses with optimized fast models</p>
            </div>

            <div className="group bg-card/40 backdrop-blur border border-border/50 rounded-2xl p-8 hover:border-primary/50 transition-all duration-300 hover:glow-primary animate-scale-in hover:-translate-y-2" style={{ animationDelay: '0.2s' }}>
              <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center mb-4 group-hover:bg-primary/30 transition-colors">
                <ImageIcon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-2 text-foreground">Vision & Images</h3>
              <p className="text-muted-foreground">Analyze images and generate stunning visuals</p>
            </div>

            <div className="group bg-card/40 backdrop-blur border border-border/50 rounded-2xl p-8 hover:border-secondary/50 transition-all duration-300 hover:glow-secondary animate-scale-in hover:-translate-y-2" style={{ animationDelay: '0.3s' }}>
              <div className="w-12 h-12 rounded-xl bg-secondary/20 flex items-center justify-center mb-4 group-hover:bg-secondary/30 transition-colors">
                <Globe className="w-6 h-6 text-secondary" />
              </div>
              <h3 className="text-xl font-bold mb-2 text-foreground">Web Search</h3>
              <p className="text-muted-foreground">Real-time information and deep research</p>
            </div>

            <div className="group bg-card/40 backdrop-blur border border-border/50 rounded-2xl p-8 hover:border-accent/50 transition-all duration-300 animate-scale-in hover:-translate-y-2" style={{ animationDelay: '0.4s' }}>
              <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center mb-4 group-hover:bg-accent/30 transition-colors">
                <Shield className="w-6 h-6 text-accent" />
              </div>
              <h3 className="text-xl font-bold mb-2 text-foreground">Uncensored Models</h3>
              <p className="text-muted-foreground">Access unrestricted AI models</p>
            </div>

            <div className="group bg-card/40 backdrop-blur border border-border/50 rounded-2xl p-8 hover:border-primary/50 transition-all duration-300 hover:glow-primary animate-scale-in hover:-translate-y-2" style={{ animationDelay: '0.5s' }}>
              <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center mb-4 group-hover:bg-primary/30 transition-colors">
                <Sparkles className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-2 text-foreground">Smart Features</h3>
              <p className="text-muted-foreground">Custom bots, memory, and powerful tools</p>
            </div>
          </div>

          {/* Model Providers */}
          <div className="mt-20 space-y-6 max-w-4xl mx-auto">
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground uppercase tracking-widest font-semibold">Trusted by hundreds of thousands</p>
              <p className="text-foreground/80 text-lg">Powered by leading AI providers</p>
            </div>
            <div className="flex flex-wrap justify-center gap-8 text-muted-foreground">
              {['OpenAI', 'Google', 'Anthropic', 'xAI', 'Meta', 'DeepSeek', 'Perplexity', 'Qwen'].map((provider) => (
                <span key={provider} className="hover:text-primary transition-colors font-medium text-base">
                  {provider}
                </span>
              ))}
            </div>
          </div>

          {/* Footer CTA */}
          <div className="mt-20 pt-12 border-t border-border/30">
            <p className="text-muted-foreground mb-6">Ready to transform your workflow?</p>
            <Button
              size="lg"
              onClick={() => navigate("/auth")}
              className="px-10 py-6 text-base font-semibold shadow-lg hover:shadow-xl transition-all duration-300 glow-primary-strong"
            >
              Start Using OnyxGPT Today
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Landing;
