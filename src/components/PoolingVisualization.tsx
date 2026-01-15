import { useMemo } from 'react';
import { PoolingStep } from '@/hooks/useCNNVisualization';

interface PoolingVisualizationProps {
  currentStep: PoolingStep | null;
  pooledMap: number[][];
  poolStep: number;
  totalSteps: number;
  size: number;
  phase: 'convolution' | 'pooling';
  // Advanced interaction props
  onPooledCellHover?: (row: number, col: number) => void;
  onPooledCellLeave?: () => void;
  selectedPooledCell?: { row: number; col: number } | null;
  isInteractive?: boolean; // True when showing user-selected cell
}

export function PoolingVisualization({
  currentStep,
  pooledMap,
  poolStep,
  totalSteps,
  size,
  phase,
  onPooledCellHover,
  onPooledCellLeave,
  selectedPooledCell,
  isInteractive = false,
}: PoolingVisualizationProps) {
  const { minVal, maxVal } = useMemo(() => {
    let min = 0;
    let max = 0;
    pooledMap.forEach(row => {
      row.forEach(val => {
        if (val !== null) {
          min = Math.min(min, val);
          max = Math.max(max, val);
        }
      });
    });
    return { minVal: min, maxVal: max };
  }, [pooledMap]);

  const getColor = (val: number | null): { bg: string; text: string } => {
    if (val === null) return { bg: 'hsl(var(--muted))', text: 'hsl(var(--muted-foreground))' };
    
    // Zero values: neutral background
    if (val === 0) {
      return { bg: 'hsl(0, 0%, 95%)', text: '#000000' };
    }
    
    const absMax = Math.max(Math.abs(minVal), Math.abs(maxVal)) || 1000;
    const normalized = val / absMax;
    
    if (normalized >= 0) {
      const intensity = Math.min(1, Math.abs(normalized));
      const lightness = 95 - (intensity * 45);
      const textColor = lightness > 60 ? '#000000' : '#ffffff';
      return { bg: `hsl(0, 84%, ${lightness}%)`, text: textColor };
    } else {
      const intensity = Math.min(1, Math.abs(normalized));
      const lightness = 95 - (intensity * 45);
      const textColor = lightness > 60 ? '#000000' : '#ffffff';
      return { bg: `hsl(217, 91%, ${lightness}%)`, text: textColor };
    }
  };

  const formatValue = (val: number | null): string => {
    if (val === null) return '';
    if (val === 0) return '0';
    if (Math.abs(val) >= 1000) {
      return (val / 1000).toFixed(0) + 'k';
    }
    return Math.round(val).toString();
  };

  const completedCells = pooledMap.flat().filter(v => v !== null).length;
  const totalCells = size * size;

  return (
    <div className={`bg-card rounded-lg border shadow-sm p-2 ${isInteractive ? 'border-yellow-400 ring-2 ring-yellow-300' : 'border-border'}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-foreground">Max Pooling (2×2)</h3>
          {isInteractive && (
            <span className="px-2 py-0.5 text-[10px] font-medium bg-yellow-100 text-yellow-800 rounded-full">
              📍 Selected Cell ({currentStep?.row}, {currentStep?.col})
            </span>
          )}
        </div>
        <span className="text-xs text-muted-foreground">
          Step {poolStep}/{totalSteps}
        </span>
      </div>
      
      <p className="text-xs text-muted-foreground mb-2">
        Selects max value from each 2×2 window.
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Pooling Window */}
        <div className="text-center">
          <h4 className="text-xs font-medium text-muted-foreground mb-2">2×2 Window</h4>
          <div className={`inline-grid grid-cols-2 gap-1 p-1 rounded ${isInteractive ? 'bg-yellow-50 ring-2 ring-yellow-300' : 'bg-secondary'}`}>
            {(currentStep?.window) ? (
              currentStep.window.map((row, i) =>
                row.map((val, j) => {
                  const isMax = val === currentStep.maxValue;
                  return (
                    <div
                      key={`pool-window-${i}-${j}`}
                      className={`w-10 h-10 flex items-center justify-center text-[10px] font-mono rounded transition-all ${
                        isMax 
                          ? 'bg-yellow-400 text-black ring-2 ring-yellow-600 scale-110 font-bold' 
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {Math.round(val)}
                    </div>
                  );
                })
              )
            ) : (Array(4).fill(null).map((_, idx) => (
              <div
                key={`empty-pool-${idx}`}
                className="w-10 h-10 flex items-center justify-center bg-muted text-muted-foreground text-[10px] font-mono rounded"
              >
                -
              </div>
            )))}
          </div>
          
          {currentStep && (
            <div className={`mt-2 inline-flex items-center gap-2 px-2 py-1 rounded ${isInteractive ? 'bg-yellow-100' : 'bg-secondary'}`}>
              <span className="text-xs font-medium text-muted-foreground">Max:</span>
              <span className="text-sm font-bold font-mono text-yellow-600">
                {Math.round(currentStep.maxValue)}
              </span>
            </div>
          )}
        </div>

        {/* Pooled Output */}
        <div className="text-center">
          <h4 className="text-xs font-medium text-muted-foreground mb-2">
            Output ({size}×{size})
          </h4>
          <div className="flex justify-center">
            <div 
              className="inline-grid bg-border"
              style={{ 
                gridTemplateColumns: `repeat(${size}, 18px)`,
                gap: '1px',
                padding: '1px',
              }}
            >
              {pooledMap.map((row, rowIdx) =>
                row.map((val, colIdx) => {
                  const colors = getColor(val);
                  const isCurrentStep = currentStep?.row === rowIdx && currentStep?.col === colIdx;
                  const isSelected = selectedPooledCell?.row === rowIdx && selectedPooledCell?.col === colIdx;
                  const isComputed = val !== null;
                  
                  return (
                    <div
                      key={`pooled-${rowIdx}-${colIdx}`}
                      className={`flex items-center justify-center transition-all ${
                        isCurrentStep ? 'ring-2 ring-yellow-400 z-10' : ''
                      } ${
                        isSelected ? 'ring-2 ring-amber-500 scale-110 z-20' : ''
                      } ${
                        isComputed ? 'cursor-pointer hover:scale-105' : ''
                      }`}
                      style={{ 
                        width: '18px',
                        height: '18px',
                        backgroundColor: isSelected ? '#FFC107' : colors.bg,
                        color: isSelected ? '#000' : colors.text,
                        fontSize: '6px',
                        fontFamily: 'monospace',
                        fontWeight: isSelected ? 800 : 600,
                      }}
                      title={isComputed ? `Click to highlight source in feature map\n(${rowIdx}, ${colIdx}): ${Math.round(val)}` : 'Not computed'}
                      onMouseEnter={() => {
                        if (isComputed && onPooledCellHover) {
                          onPooledCellHover(rowIdx, colIdx);
                        }
                      }}
                      onMouseLeave={() => {
                        if (onPooledCellLeave) {
                          onPooledCellLeave();
                        }
                      }}
                    >
                      {formatValue(val)}
                    </div>
                  );
                })
              )}
            </div>
          </div>
          
          <p className="mt-2 text-xs text-muted-foreground">
            {completedCells}/{totalCells} pooled
          </p>
        </div>
      </div>

      {/* Color Legend */}
      <div className="flex items-center justify-center gap-3 text-xs mt-2">
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 rounded flex items-center justify-center text-white text-[6px] font-mono" style={{ backgroundColor: 'hsl(217, 91%, 50%)' }}>-</div>
          <span className="text-muted-foreground">Neg</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 rounded border border-border flex items-center justify-center text-black text-[6px] font-mono" style={{ backgroundColor: 'hsl(0, 0%, 95%)' }}>0</div>
          <span className="text-muted-foreground">Zero</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 rounded flex items-center justify-center text-white text-[6px] font-mono" style={{ backgroundColor: 'hsl(0, 84%, 50%)' }}>+</div>
          <span className="text-muted-foreground">Pos</span>
        </div>
      </div>
    </div>
  );
}
