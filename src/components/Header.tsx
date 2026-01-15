export function Header() {
  return (
    <header className="bg-card border-b border-border shadow-sm">
      <div className="max-w-6xl mx-auto px-3 py-2">
        <div className="flex items-center gap-2">
          <img 
            src="/favicon.ico.png" 
            alt="TechProjectHub Logo" 
            className="h-10 w-auto"
          />
          <div>
            <h1 className="text-lg md:text-xl font-bold text-foreground">
              CNN Feature Extraction Visualizer
            </h1>
            <p className="text-xs text-muted-foreground">
              Step-by-step Convolution and Pooling on MNIST
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
