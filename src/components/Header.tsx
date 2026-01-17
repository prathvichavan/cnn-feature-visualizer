export function Header() {
  return (
    <header className="header-strong nav-stable border-b">
      <div className="max-w-6xl mx-auto px-3 py-2">
        <div className="flex items-center gap-3">
          <div className="inline-flex items-center" style={{ lineHeight: 0 }}>
            <img
              src={`${import.meta.env.BASE_URL}techlogo.png`}
              alt="TechProjectHub logo"
              className="logo-sharp logo-locked-48 logo-tone-neutral"
              style={{ width: 'auto' }}
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                // Fallback to existing favicon if the preferred file is missing
                target.onerror = null;
                target.src = `${import.meta.env.BASE_URL}favicon.ico.png`;
              }}
            />
          </div>
          <div>
            <div className="flex items-baseline gap-3">
              <h1 className="text-lg md:text-xl font-bold text-foreground">CNN Feature Extraction Visualizer</h1>
              <span className="text-xs text-muted-foreground">by TechProjectHub</span>
            </div>
            <p className="text-xs text-muted-foreground">Step-by-step Convolution and Pooling on MNIST</p>
          </div>
        </div>
      </div>
    </header>
  );
}
