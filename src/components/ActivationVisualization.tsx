import { useMemo, useState } from 'react';
import { ActivationType, PoolingSourceType } from '@/hooks/useCNNVisualization';
import { Button } from '@/components/ui/button';
import { Play, Pause, RotateCcw, StepForward, PlayCircle } from 'lucide-react';

// Status type for display
type StageStatus = 'waiting' | 'running' | 'completed';

// Activation type labels and descriptions for UI
const ACTIVATION_TYPE_LABELS: Record<ActivationType, string> = {
  none: 'None (Raw)',
  relu: 'ReLU',
  sigmoid: 'Sigmoid',
  softmax: 'Softmax',
};

const ACTIVATION_TYPE_DESCRIPTIONS: Record<ActivationType, string> = {
  none: 'No activation applied. Pass raw feature map forward.',
  relu: 'Removes negative responses and keeps positive features. ReLU(x) = max(0, x)',
  sigmoid: 'Squashes values between 0 and 1. σ(x) = 1/(1 + e^(-x))',
  softmax: 'Converts values into normalized probabilities. Shown for educational purposes.',
};

const POOLING_SOURCE_DESCRIPTIONS: Record<PoolingSourceType, string> = {
  raw: 'Pooling is applied directly after convolution.',
  activated: 'Pooling is applied after non-linearity.',
};

interface ActivationVisualizationProps {
  featureMap: (number | null)[][];
  activatedMap: (number | null)[][];
  size: number;
  activationType: ActivationType;
  onActivationTypeChange: (type: ActivationType) => void;
  poolingSource: PoolingSourceType;
  onPoolingSourceChange: (source: PoolingSourceType) => void;
  phase: 'convolution' | 'activation' | 'pooling' | 'flatten' | 'dense';
  // Step/Play/Reset controls for activation
  onStep: () => void;
  onTogglePlay: () => void;
  onReset: () => void;
  isPlaying: boolean;
  isActivationComplete: boolean;
  activationStep: number;
  totalActivationSteps: number;
  // NEW: Status indicator
  status: StageStatus;
  // NEW: Convolution complete check (to enable activation)
  isConvolutionComplete: boolean;
  // NEW: Function to start activation phase
  onStartActivation: () => void;
  // NEW: Hover callbacks to highlight feature map
  onActivatedCellHover?: (row: number, col: number) => void;
  onActivatedCellLeave?: () => void;
  // NEW: Stride for calculating input window position
  stride?: number;
}

export function ActivationVisualization({
  featureMap,
  activatedMap,
  size,
  activationType,
  onActivationTypeChange,
  poolingSource,
  onPoolingSourceChange,
  phase,
  onStep,
  onTogglePlay,
  onReset,
  isPlaying,
  isActivationComplete,
  activationStep,
  totalActivationSteps,
  status,
  isConvolutionComplete,
  onStartActivation,
  onActivatedCellHover,
  onActivatedCellLeave,
  stride = 1,
}: ActivationVisualizationProps) {
  // Track hovered cell
  const [hoveredCell, setHoveredCell] = useState<{ row: number; col: number } | null>(null);

  // Calculate min/max for color scaling
  const { minVal, maxVal } = useMemo(() => {
    let min = 0;
    let max = 0;
    activatedMap.forEach(row => {
      row.forEach(val => {
        if (val !== null) {
          min = Math.min(min, val);
          max = Math.max(max, val);
        }
      });
    });
    return { minVal: min, maxVal: max };
  }, [activatedMap]);

  // Get color based on value - only color non-zero values
  const getColor = (val: number | null): { bg: string; text: string } => {
    if (val === null) return { bg: 'hsl(var(--muted))', text: 'hsl(var(--muted-foreground))' };
    
    // Zero values: neutral background
    if (val === 0) {
      return { bg: 'hsl(0, 0%, 95%)', text: '#000000' };
    }
    
    // For softmax (values 0-1), use different scaling
    if (activationType === 'softmax') {
      const intensity = Math.min(1, val * 10); // Scale up for visibility
      const lightness = 95 - (intensity * 45);
      const textColor = lightness > 60 ? '#000000' : '#ffffff';
      return { bg: `hsl(280, 70%, ${lightness}%)`, text: textColor }; // Purple for softmax
    }
    
    // For sigmoid (values 0-1)
    if (activationType === 'sigmoid') {
      const intensity = val;
      const lightness = 95 - (intensity * 45);
      const textColor = lightness > 60 ? '#000000' : '#ffffff';
      return { bg: `hsl(160, 70%, ${lightness}%)`, text: textColor }; // Teal for sigmoid
    }
    
    // For ReLU and none
    const absMax = Math.max(Math.abs(minVal), Math.abs(maxVal)) || 1;
    const normalized = val / absMax;
    
    if (normalized >= 0) {
      const intensity = Math.min(1, Math.abs(normalized));
      const lightness = 95 - (intensity * 45);
      const textColor = lightness > 60 ? '#000000' : '#ffffff';
      return { bg: `hsl(0, 84%, ${lightness}%)`, text: textColor }; // Red for positive
    } else {
      const intensity = Math.min(1, Math.abs(normalized));
      const lightness = 95 - (intensity * 45);
      const textColor = lightness > 60 ? '#000000' : '#ffffff';
      return { bg: `hsl(217, 91%, ${lightness}%)`, text: textColor }; // Blue for negative
    }
  };

  // Format value for display
  const formatValue = (val: number | null): string => {
    if (val === null) return '';
    if (activationType === 'softmax') {
      return val.toFixed(3);
    }
    if (activationType === 'sigmoid') {
      return val.toFixed(2);
    }
    if (val === 0) return '0';
    if (Math.abs(val) >= 1000) {
      return (val / 1000).toFixed(0) + 'k';
    }
    return Math.round(val).toString();
  };

  const computedCells = activatedMap.flat().filter(v => v !== null).length;
  const totalCells = size * size;

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

  // Can we run activation controls?
  const canRunActivation = isConvolutionComplete && phase === 'activation';

  return (
    <div className="bg-card rounded-lg border border-border shadow-sm p-3">
      {/* Header with Status and Controls */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-foreground">Activation Function</h3>
          <span className={`px-2 py-0.5 text-[10px] font-medium rounded-full ${statusBadge.className}`}>
            {statusBadge.text}
          </span>
          <span className="text-xs text-muted-foreground">
            Step {activationStep}/{totalActivationSteps}
          </span>
        </div>
        {/* Start Activation Button (shown when convolution is complete but activation hasn't started) */}
        {isConvolutionComplete && phase !== 'activation' && phase !== 'pooling' && activationStep === 0 && (
          <Button
            onClick={onStartActivation}
            variant="default"
            size="sm"
            className="h-7 px-3 text-xs flex items-center gap-1 bg-orange-500 hover:bg-orange-600"
            title="Start activation phase"
          >
            <PlayCircle className="w-3 h-3" />
            Start Activation
          </Button>
        )}
        {/* Step/Play/Reset Buttons (shown when in activation phase) */}
        {(phase === 'activation' || activationStep > 0) && (
          <div className="flex gap-1">
            <Button
              onClick={onStep}
              disabled={isPlaying || isActivationComplete || !canRunActivation}
              variant="outline"
              size="sm"
              className="h-7 px-2 text-xs flex items-center gap-1"
              title={!canRunActivation ? 'Complete convolution first' : 'Step through activation'}
            >
              <StepForward className="w-3 h-3" />
              Step
            </Button>
            <Button
              onClick={onTogglePlay}
              disabled={isActivationComplete || !canRunActivation}
              variant="default"
              size="sm"
              className="h-7 px-2 text-xs flex items-center gap-1"
              title={!canRunActivation ? 'Complete convolution first' : 'Auto-play activation'}
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
            title="Reset activation (keep convolution)"
          >
            <RotateCcw className="w-3 h-3" />
            Reset
          </Button>
        </div>
        )}
      </div>

      {/* Activation Type Control Panel */}
      <div className="mb-3 p-2 bg-secondary/50 rounded-lg border border-border">
        <label className="text-xs font-medium text-foreground block mb-2">Activation Type</label>
        <div className="flex flex-wrap gap-2">
          {(['none', 'relu', 'sigmoid', 'softmax'] as ActivationType[]).map((type) => (
            <button
              key={type}
              onClick={() => onActivationTypeChange(type)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                activationType === type
                  ? type === 'none' ? 'bg-gray-500 text-white shadow-md' :
                    type === 'relu' ? 'bg-orange-500 text-white shadow-md' :
                    type === 'sigmoid' ? 'bg-teal-500 text-white shadow-md' :
                    'bg-purple-500 text-white shadow-md'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {ACTIVATION_TYPE_LABELS[type]}
            </button>
          ))}
        </div>
        {/* Dynamic explanation text */}
        <p className="text-xs text-muted-foreground mt-2 italic">
          {ACTIVATION_TYPE_DESCRIPTIONS[activationType]}
        </p>
        {activationType === 'softmax' && (
          <p className="text-xs text-amber-600 mt-1 font-medium">
            ⚠️ Softmax is shown here for educational purposes only.
          </p>
        )}
      </div>

      {/* Activated Feature Map Visualization */}
      <div className="text-center mb-3">
        <h4 className="text-xs font-medium text-muted-foreground mb-2">
          Activated Feature Map ({size}×{size})
          {hoveredCell && (
            <span className="ml-2 text-orange-600">
              Hovering: ({hoveredCell.row}, {hoveredCell.col})
            </span>
          )}
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
            {activatedMap.map((row, rowIdx) =>
              row.map((val, colIdx) => {
                const colors = getColor(val);
                const isComputed = val !== null;
                const isHovered = hoveredCell?.row === rowIdx && hoveredCell?.col === colIdx;
                
                return (
                  <div
                    key={`activated-${rowIdx}-${colIdx}`}
                    className={`flex items-center justify-center transition-all ${
                      isComputed ? 'cursor-pointer' : ''
                    } ${isHovered ? 'ring-2 ring-orange-500 scale-110 z-10' : ''}`}
                    style={{ 
                      width: '18px',
                      height: '18px',
                      backgroundColor: colors.bg,
                      color: colors.text,
                      fontSize: '7px',
                      fontFamily: 'monospace',
                      fontWeight: 600,
                    }}
                    title={isComputed ? `(${rowIdx}, ${colIdx}): ${val?.toFixed(4)}\nHover to highlight source in Feature Map` : 'Not computed'}
                    onMouseEnter={() => {
                      if (isComputed) {
                        setHoveredCell({ row: rowIdx, col: colIdx });
                        onActivatedCellHover?.(rowIdx, colIdx);
                      }
                    }}
                    onMouseLeave={() => {
                      setHoveredCell(null);
                      onActivatedCellLeave?.();
                    }}
                  >
                    {formatValue(val)}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Pooling Source Control */}
      <div className="p-2 bg-secondary/50 rounded-lg border border-border">
        <label className="text-xs font-medium text-foreground block mb-2">Apply Pooling On</label>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => onPoolingSourceChange('raw')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
              poolingSource === 'raw'
                ? 'bg-blue-500 text-white shadow-md'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            📊 Raw Feature Map
          </button>
          <button
            onClick={() => onPoolingSourceChange('activated')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
              poolingSource === 'activated'
                ? 'bg-green-500 text-white shadow-md'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            ⚡ Activated Feature Map
          </button>
        </div>
        {/* Dynamic explanation text */}
        <p className="text-xs text-muted-foreground mt-2 italic">
          {POOLING_SOURCE_DESCRIPTIONS[poolingSource]}
        </p>
      </div>

      {/* Color Legend */}
      <div className="flex items-center justify-center gap-3 text-xs mt-3">
        {activationType === 'none' || activationType === 'relu' ? (
          <>
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
          </>
        ) : activationType === 'sigmoid' ? (
          <>
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 rounded border border-border flex items-center justify-center text-black text-[6px] font-mono" style={{ backgroundColor: 'hsl(160, 70%, 90%)' }}>0</div>
              <span className="text-muted-foreground">Low</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 rounded flex items-center justify-center text-white text-[6px] font-mono" style={{ backgroundColor: 'hsl(160, 70%, 50%)' }}>1</div>
              <span className="text-muted-foreground">High</span>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 rounded border border-border flex items-center justify-center text-black text-[6px] font-mono" style={{ backgroundColor: 'hsl(280, 70%, 90%)' }}>0</div>
              <span className="text-muted-foreground">Low</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 rounded flex items-center justify-center text-white text-[6px] font-mono" style={{ backgroundColor: 'hsl(280, 70%, 50%)' }}>1</div>
              <span className="text-muted-foreground">High</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
