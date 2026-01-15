import { ConvolutionStep } from '@/hooks/useCNNVisualization';

interface ConvolutionVisualizationProps {
  filter: number[][];
  currentStep: ConvolutionStep | null;
  convStep: number;
  totalSteps: number;
  phase: 'convolution' | 'pooling';
  isInteractive?: boolean; // True when showing user-selected cell
}

export function ConvolutionVisualization({
  filter,
  currentStep,
  convStep,
  totalSteps,
  phase,
  isInteractive = false,
}: ConvolutionVisualizationProps) {
  return (
    <div className={`bg-card rounded-lg border shadow-sm p-2 ${isInteractive ? 'border-yellow-400 ring-2 ring-yellow-300' : 'border-border'}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-foreground">Convolution Operation</h3>
          {isInteractive && (
            <span className="px-2 py-0.5 text-[10px] font-medium bg-yellow-100 text-yellow-800 rounded-full">
              📍 Selected Cell ({currentStep?.row}, {currentStep?.col})
            </span>
          )}
        </div>
        <span className="text-xs text-muted-foreground">
          Step {convStep}/{totalSteps}
        </span>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Input Window */}
        <div className="text-center">
          <h4 className="text-xs font-medium text-muted-foreground mb-2">Input (3×3)</h4>
          <div className="inline-grid grid-cols-3 gap-1 bg-secondary p-1 rounded">
            {currentStep?.inputWindow.map((row, i) =>
              row.map((val, j) => {
                const pixelVal = Math.round(val);
                const brightness = pixelVal > 127 ? '#000' : '#fff';
                return (
                  <div
                    key={`input-${i}-${j}`}
                    className="w-9 h-9 flex items-center justify-center text-[9px] font-mono rounded"
                    style={{ 
                      backgroundColor: `rgb(${pixelVal}, ${pixelVal}, ${pixelVal})`,
                      color: brightness
                    }}
                  >
                    {pixelVal}
                  </div>
                );
              })
            ) ?? Array(9).fill(null).map((_, idx) => (
              <div
                key={`empty-${idx}`}
                className="w-9 h-9 flex items-center justify-center bg-muted text-muted-foreground text-[10px] font-mono rounded"
              >
                -
              </div>
            ))}
          </div>
        </div>

        {/* Filter/Kernel */}
        <div className="text-center">
          <h4 className="text-xs font-medium text-muted-foreground mb-2">Filter</h4>
          <div className="inline-grid grid-cols-3 gap-1 bg-secondary p-1 rounded">
            {filter.map((row, i) =>
              row.map((val, j) => {
                // Clamp value to -1.0 to 1.0
                const clamped = Math.max(-1, Math.min(1, val));
                return (
                  <div
                    key={`filter-${i}-${j}`}
                    className={`w-9 h-9 flex items-center justify-center text-[10px] font-mono font-bold rounded ${
                      clamped > 0 
                        ? 'bg-positive/20 text-positive' 
                        : clamped < 0 
                          ? 'bg-negative/20 text-negative'
                          : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {clamped > 0 ? `+${clamped.toFixed(1)}` : clamped.toFixed(1)}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Multiplication Details - Compact */}
      <div className="mt-2 text-center">
        <h4 className="text-xs font-medium text-muted-foreground mb-1">Element-wise Multiplication</h4>
        <div className="flex flex-wrap items-center justify-center gap-1 bg-secondary p-2 rounded overflow-x-auto">
          {(() => {
            if (!currentStep?.inputWindow || !filter || !currentStep?.multiplications) {
              return Array(9).fill(null).map((_, idx) => (
                <span key={`empty-detail-${idx}`} className="text-[10px] text-muted-foreground">(-×-)</span>
              ));
            }
            // Flatten all matrices to 1D arrays
            const inputFlat = currentStep.inputWindow.flat();
            const filterFlat = filter.flat();
            const multFlat = currentStep.multiplications.flat();
            return inputFlat.map((inputVal, idx) => {
              const pixelVal = Math.round(inputVal);
              const multVal = Math.round(multFlat[idx]);
              return (
              <>
                <span key={`detail-${idx}`} className="flex items-center">
                  <span className="px-1 py-0.5 rounded font-mono text-[9px] bg-muted text-foreground">{pixelVal}</span>
                  <span className="mx-0.5 text-[10px] text-muted-foreground">×</span>
                  <span className={`px-1 py-0.5 rounded font-mono text-[9px] ${
                    filterFlat[idx] > 0 ? 'bg-positive/20 text-positive' : filterFlat[idx] < 0 ? 'bg-negative/20 text-negative' : 'bg-muted text-muted-foreground'
                  }`}>{filterFlat[idx]}</span>
                  <span className="mx-0.5 text-[10px] text-muted-foreground">=</span>
                  <span className={`px-1 py-0.5 rounded font-mono text-[9px] border ${
                    multVal > 0 ? 'bg-positive/20 text-positive' : multVal < 0 ? 'bg-negative/20 text-negative' : 'bg-muted text-muted-foreground'
                  }`}>{multVal}</span>
                </span>
                {idx < inputFlat.length - 1 && (
                  <span key={`plus-detail-${idx}`} className="text-xs font-bold text-muted-foreground">+</span>
                )}
              </>
            )});
          })()}
          <span className="text-xs font-bold text-muted-foreground">=</span>
          <span className={`px-2 py-0.5 rounded font-mono text-sm border ${
            currentStep?.sum !== undefined
              ? currentStep.sum >= 0 
                ? 'bg-positive/20 text-positive' 
                : 'bg-negative/20 text-negative'
              : 'bg-muted text-muted-foreground'
          }`}>
            {currentStep?.sum !== undefined ? currentStep.sum : '-'}
          </span>
        </div>
      </div>

      {/* Sum Result */}
      <div className="mt-2 text-center">
        <div className="inline-flex items-center gap-2 bg-secondary px-3 py-1 rounded">
          <span className="text-xs font-medium text-muted-foreground">Sum:</span>
          <span className={`text-sm font-bold font-mono ${
            currentStep?.sum !== undefined
              ? currentStep.sum >= 0 
                ? 'text-positive' 
                : 'text-negative'
              : 'text-muted-foreground'
          }`}>
            {currentStep?.sum !== undefined ? currentStep.sum : '-'}
          </span>
        </div>
      </div>
    </div>
  );
}
