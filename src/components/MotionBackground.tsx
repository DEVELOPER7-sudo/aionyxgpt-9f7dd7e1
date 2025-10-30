const MotionBackground = () => {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      <div 
        className="absolute inset-0 opacity-30 animate-gradient"
        style={{
          background: `linear-gradient(45deg, 
            hsl(var(--primary) / 0.1), 
            hsl(var(--accent) / 0.1), 
            hsl(var(--primary) / 0.15),
            hsl(var(--accent) / 0.05)
          )`,
        }}
      />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-float" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/3 rounded-full blur-3xl animate-pulse-glow" />
    </div>
  );
};

export default MotionBackground;
