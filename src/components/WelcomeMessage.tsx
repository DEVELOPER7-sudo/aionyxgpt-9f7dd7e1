import { Sparkles, Image as ImageIcon, MessageSquare, Zap } from 'lucide-react';

const WelcomeMessage = () => {
  return (
    <div className="flex items-center justify-center h-full p-6 animate-fade-in">
      <div className="max-w-2xl text-center space-y-8">
        {/* Main greeting */}
        <div className="space-y-4 animate-bounce-in">
          <div className="inline-block p-4 bg-primary/10 rounded-full glow-blue animate-pulse-glow">
            <img src="https://res.cloudinary.com/dcwnn9c0u/image/upload/v1763027959/zk5ditmfngx9bwa2fn7g.png" alt="OnyxGPT logo" className="w-12 h-12 rounded-lg" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent animate-gradient">
            Welcome to OnyxGPT! 👋
          </h1>
          <p className="text-lg text-muted-foreground animate-slide-up">
            Your intelligent companion for conversations, creativity, and analysis
          </p>
        </div>

        {/* Features grid */}
        <div className="grid md:grid-cols-3 gap-4 mt-8">
          <div className="p-6 bg-card border border-border rounded-lg hover:border-primary/50 transition-all duration-300 hover:scale-105 animate-scale-in" style={{ animationDelay: '0.1s' }}>
            <MessageSquare className="w-8 h-8 text-primary mb-3 mx-auto" />
            <h3 className="font-semibold mb-2">Chat Naturally</h3>
            <p className="text-sm text-muted-foreground">
              Have conversations with powerful AI models
            </p>
          </div>
          
          <div className="p-6 bg-card border border-border rounded-lg hover:border-primary/50 transition-all duration-300 hover:scale-105 animate-scale-in" style={{ animationDelay: '0.2s' }}>
            <ImageIcon className="w-8 h-8 text-primary mb-3 mx-auto" />
            <h3 className="font-semibold mb-2">Generate & Analyze</h3>
            <p className="text-sm text-muted-foreground">
              Create amazing images and analyze any picture
            </p>
          </div>
          
          <div className="p-6 bg-card border border-border rounded-lg hover:border-primary/50 transition-all duration-300 hover:scale-105 animate-scale-in" style={{ animationDelay: '0.3s' }}>
            <Zap className="w-8 h-8 text-primary mb-3 mx-auto" />
            <h3 className="font-semibold mb-2">Multiple Models</h3>
            <p className="text-sm text-muted-foreground">
              Access GPT-5, Claude, Gemini, and more
            </p>
          </div>
        </div>

        {/* Call to action */}
        <div className="pt-8 animate-slide-up" style={{ animationDelay: '0.4s' }}>
          <p className="text-sm text-muted-foreground mb-4">
            ✨ Start by typing a message below or uploading an image
          </p>
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <span className="inline-block w-2 h-2 bg-primary rounded-full animate-pulse"></span>
            <span>Powered by cutting-edge AI technology</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WelcomeMessage;
