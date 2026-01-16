import { useMemo } from 'react';
import { PoolingStep, PoolingType } from '@/hooks/useCNNVisualization';
import { Button } from '@/components/ui/button';
import { Play, Pause, RotateCcw, StepForward } from 'lucide-react';

// Pooling type labels and descriptions for UI
const POOLING_TYPE_LABELS: Record<PoolingType, string> = {
  max: 'Max Pooling',
  min: 'Min Pooling',
  average: 'Average Pooling',
  globalAverage: 'Global Average Pooling',
};

const POOLING_TYPE_DESCRIPTIONS: Record<PoolingType, string> = {
  max: 'Selects the strongest activation in each window.',
  min: 'Selects the weakest activation in each window.',
  average: 'Computes the average response in each window.',
  globalAverage: 'Summarizes the entire feature map into a single value.',
};

// Status type for display
type StageStatus = 'waiting' | 'running' | 'completed';

interface PoolingVisualizationProps {
  currentStep: PoolingStep | null;
  pooledMap: number[][];
  poolStep: number;
  totalSteps: number;
  size: number;
  phase: 'convolution' | 'activation' | 'pooling';
  // Pooling type controls
  poolingType: PoolingType;
  onPoolingTypeChange: (type: PoolingType) => void;
  // Step/Play/Reset controls for pooling
  onStep: () => void;
  onTogglePlay: () => void;
  onReset: () => void;
  isPlaying: boolean;
  isPoolingComplete: boolean;
  // Advanced interaction props
  onPooledCellHover?: (row: number, col: number) => void;
  onPooledCellLeave?: () => void;
  selectedPooledCell?: { row: number; col: number } | null;
  isInteractive?: boolean; // True when showing user-selected cell
  // NEW: Status indicator
  status: StageStatus;
  // NEW: Convolution complete check (to enable pooling at any time)
  isConvolutionComplete: boolean;
  // NEW: Function to start pooling phase
  onStartPooling: () => void;
}

export function PoolingVisualization({
  currentStep,
  pooledMap,
  poolStep,
  totalSteps,
  size,
  phase,
  poolingType,
  onPoolingTypeChange,
  onStep,
  onTogglePlay,
  onReset,
  isPlaying,
  isPoolingComplete,
  onPooledCellHover,
  onPooledCellLeave,
  selectedPooledCell,
  isInteractive = false,
  status,
  isConvolutionComplete,
  onStartPooling,
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
  // For global average pooling, the output is always 1×1
  const outputSize = poolingType === 'globalAverage' ? 1 : size;
  const totalCells = outputSize * outputSize;
  const displayTotalSteps = poolingType === 'globalAverage' ? 1 : totalSteps;

  // Helper to determine if a cell in the 2×2 window should be highlighted
  const shouldHighlightWindowCell = (i: number, j: number): boolean => {
    if (!currentStep) return false;
    
    switch (poolingType) {
      case 'max':
        // Highlight only the max cell
        return currentStep.maxCellPosition?.i === i && currentStep.maxCellPosition?.j === j;
      case 'min':
        // Highlight only the min cell
        return currentStep.minCellPosition?.i === i && currentStep.minCellPosition?.j === j;
      case 'average':
        // Highlight all cells in the window for average pooling
        return true;
      case 'globalAverage':
        // Not used for global average (entire feature map is the window)
        return true;
      default:
        return false;
    }
  };

  // Get the appropriate highlight style based on pooling type
  const getHighlightStyle = (isHighlighted: boolean): string => {
    if (!isHighlighted) return 'bg-muted text-muted-foreground';
    
    switch (poolingType) {
      case 'max':
        return 'bg-yellow-400 text-black ring-2 ring-yellow-600 scale-110 font-bold';
      case 'min':
        return 'bg-blue-400 text-black border-2 border-dashed border-blue-700 scale-110 font-bold';
      case 'average':
        return 'bg-green-300 text-black ring-1 ring-green-600 font-semibold';
      case 'globalAverage':
        return 'bg-purple-300 text-black ring-1 ring-purple-600 font-semibold';
      default:
        return 'bg-yellow-400 text-black';
    }
  };

  // Get the result value based on pooling type
  const getResultValue = (): number | null => {
    if (!currentStep) return null;
    return currentStep.resultValue ?? currentStep.maxValue;
  };

  // Get result label based on pooling type
  const getResultLabel = (): string => {
    switch (poolingType) {
      case 'max': return 'Max';
      case 'min': return 'Min';
      case 'average': return 'Avg';
      case 'globalAverage': return 'Global Avg';
      default: return 'Result';
    }
  };

  // Get result color based on pooling type
  const getResultColor = (): string => {
    switch (poolingType) {
      case 'max': return 'text-yellow-600';
      case 'min': return 'text-blue-600';
      case 'average': return 'text-green-600';
      case 'globalAverage': return 'text-purple-600';
      default: return 'text-yellow-600';
    }
  };

  // Get status badge styling
  const getStatusBadge = () => {
    switch (status) {
      case 'waiting':
        return { text: 'Waiting', className: 'bg-gray-100 text-gray-600' };
      case 'running':
        return { text: 'Running', className: 'bg-blue-100 text-blue-600 animate-pulse' };
      case 'completed':
        return { text: 'Completed', className: 'bg-green-100 text-green-600' };
    }
  };

  const statusBadge = getStatusBadge();

  // Can we run pooling controls?
  const canRunPooling = isConvolutionComplete && phase === 'pooling';

  return (
    <div className={`bg-card rounded-lg border shadow-sm p-2 ${isInteractive ? 'border-yellow-400 ring-2 ring-yellow-300' : 'border-border'}`}>
      {/* Header with pooling type selector and status */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="text-sm font-semibold text-foreground">
            {POOLING_TYPE_LABELS[poolingType]} {poolingType !== 'globalAverage' ? '(2×2)' : ''}
          </h3>
          <span className={`px-2 py-0.5 text-[10px] font-medium rounded-full ${statusBadge.className}`}>
            {statusBadge.text}
          </span>
          {isInteractive && currentStep && (
            <span className="px-2 py-0.5 text-[10px] font-medium bg-yellow-100 text-yellow-800 rounded-full">
              📍 Selected Cell ({currentStep.row}, {currentStep.col})
            </span>
          )}
        </div>
        <span className="text-xs text-muted-foreground">
          Step {poolStep}/{displayTotalSteps}
        </span>
      </div>

      {/* Start Pooling Button (shown when convolution is complete but pooling hasn't started) */}
      {isConvolutionComplete && phase !== 'pooling' && poolStep === 0 && (
        <div className="mb-3 p-2 bg-green-50 rounded-lg border border-green-200">
          <div className="flex items-center justify-between">
            <p className="text-xs text-green-700">Pooling can be applied on raw or activated feature map.</p>
            <Button
              onClick={onStartPooling}
              variant="default"
              size="sm"
              className="h-7 px-3 text-xs flex items-center gap-1 bg-green-500 hover:bg-green-600"
              title="Start pooling phase"
            >
              <Play className="w-3 h-3" />
              Start Pooling
            </Button>
          </div>
        </div>
      )}

      {/* Pooling Type Control Panel */}
      <div className="mb-3 p-2 bg-secondary/50 rounded-lg border border-border">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
          <label className="text-xs font-medium text-foreground">Pooling Type</label>
          {/* Step/Play/Reset Buttons */}
          <div className="flex gap-1">
            <Button
              onClick={onStep}
              disabled={isPlaying || isPoolingComplete || !canRunPooling}
              variant="outline"
              size="sm"
              className="h-7 px-2 text-xs flex items-center gap-1"
              title={!canRunPooling ? 'Start pooling first' : 'Step through pooling'}
            >
              <StepForward className="w-3 h-3" />
              Step
            </Button>
            <Button
              onClick={onTogglePlay}
              disabled={isPoolingComplete || !canRunPooling}
              variant="default"
              size="sm"
              className="h-7 px-2 text-xs flex items-center gap-1"
              title={!canRunPooling ? 'Start pooling first' : 'Auto-play pooling'}
            >
              {isPlaying ? (
                <>
                  <Pause className="w-3 h-3" />
                  Pause
                </>
              ) : (
                <>
                  <Play className="w-3 h-3" />
                  Play
                </>
              )}
            </Button>
            <Button
              onClick={onReset}
              variant="outline"
              size="sm"
              className="h-7 px-2 text-xs flex items-center gap-1"
              title="Reset pooling (keep convolution)"
            >
              <RotateCcw className="w-3 h-3" />
              Reset
            </Button>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {(['max', 'min', 'average', 'globalAverage'] as PoolingType[]).map((type) => (
            <button
              key={type}
              onClick={() => onPoolingTypeChange(type)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                poolingType === type
                  ? type === 'max' ? 'bg-yellow-500 text-black shadow-md' :
                    type === 'min' ? 'bg-blue-500 text-white shadow-md' :
                    type === 'average' ? 'bg-green-500 text-white shadow-md' :
                    'bg-purple-500 text-white shadow-md'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {type === 'max' && '📈 Max'}
              {type === 'min' && '📉 Min'}
              {type === 'average' && '📊 Average'}
              {type === 'globalAverage' && '🌐 Global Avg'}
            </button>
          ))}
        </div>
        {/* Dynamic explanation text */}
        <p className="text-xs text-muted-foreground mt-2 italic">
          {POOLING_TYPE_DESCRIPTIONS[poolingType]}
        </p>
      </div>

      {/* Global Average Pooling - Special Display */}
      {poolingType === 'globalAverage' ? (
        <div className="text-center py-4">
          <p className="text-xs text-muted-foreground mb-4">
            Global Average Pooling reduces each feature map to one value.
          </p>
          {currentStep ? (
            <div className="inline-flex flex-col items-center gap-3">
              <div className="text-xs text-muted-foreground">
                Averaging entire {size}×{size} feature map → 1×1 output
              </div>
              <div 
                className="w-20 h-20 flex items-center justify-center rounded-lg shadow-lg border-2 border-purple-500 bg-purple-100"
                title={`Global Average: ${currentStep.resultValue?.toFixed(2)}`}
              >
                <span className="text-lg font-bold font-mono text-purple-700">
                  {currentStep.resultValue !== undefined ? Math.round(currentStep.resultValue) : '-'}
                </span>
              </div>
              <div className="text-xs text-purple-600 font-medium">
                Global Average = {currentStep.resultValue?.toFixed(2)}
              </div>
            </div>
          ) : (
            <div className="inline-flex flex-col items-center gap-3">
              <div className="text-xs text-muted-foreground">
                Step through to compute global average
              </div>
              <div className="w-20 h-20 flex items-center justify-center rounded-lg border-2 border-dashed border-purple-300 bg-muted">
                <span className="text-lg font-mono text-muted-foreground">?</span>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Standard Pooling (Max, Min, Average) Display */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Pooling Window */}
          <div className="text-center">
            <h4 className="text-xs font-medium text-muted-foreground mb-2">2×2 Window</h4>
            <div className={`inline-grid grid-cols-2 gap-1 p-1 rounded ${isInteractive ? 'bg-yellow-50 ring-2 ring-yellow-300' : 'bg-secondary'}`}>
              {(currentStep?.window && currentStep.window.length === 2) ? (
                currentStep.window.map((row, i) =>
                  row.map((val, j) => {
                    const isHighlighted = shouldHighlightWindowCell(i, j);
                    return (
                      <div
                        key={`pool-window-${i}-${j}`}
                        className={`w-10 h-10 flex items-center justify-center text-[10px] font-mono rounded transition-all ${getHighlightStyle(isHighlighted)}`}
                        title={poolingType === 'average' ? 'Average of 4 values' : undefined}
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
                <span className="text-xs font-medium text-muted-foreground">{getResultLabel()}:</span>
                <span className={`text-sm font-bold font-mono ${getResultColor()}`}>
                  {getResultValue() !== null ? Math.round(getResultValue()!) : '-'}
                </span>
                {poolingType === 'average' && (
                  <span className="text-[10px] text-muted-foreground ml-1" title="Average of 4 values">
                    (÷4)
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Pooled Output */}
          <div className="text-center">
            <h4 className="text-xs font-medium text-muted-foreground mb-2">
              Output ({outputSize}×{outputSize})
            </h4>
            <div className="flex justify-center">
              <div 
                className="inline-grid bg-border"
                style={{ 
                  gridTemplateColumns: `repeat(${outputSize}, 18px)`,
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
                        title={isComputed ? `Click to highlight source in feature map\n(${rowIdx}, ${colIdx}): ${Math.round(val!)}` : 'Not computed'}
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
      )}

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
