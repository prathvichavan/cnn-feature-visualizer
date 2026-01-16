import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Play, Pause, RotateCcw, StepForward, PlayCircle } from 'lucide-react';

// Dense layer activation types
export type DenseActivationType = 'none' | 'relu' | 'softmax';

// Status type for display
type StageStatus = 'waiting' | 'running' | 'completed';

// Activation labels and descriptions
const DENSE_ACTIVATION_LABELS: Record<DenseActivationType, string> = {
  none: 'None (Linear)',
  relu: 'ReLU',
  softmax: 'Softmax',
};

const DENSE_ACTIVATION_DESCRIPTIONS: Record<DenseActivationType, string> = {
  none: 'No activation applied. Output is the raw weighted sum plus bias.',
  relu: 'ReLU(x) = max(0, x). Removes negative values.',
  softmax: 'Converts outputs to probabilities that sum to 1.',
};

interface DenseLayerVisualizationProps {
  // Input from flatten layer
  flattenedVector: number[];
  isFlattenComplete: boolean;
  // Dense layer state
  denseLayerSize: number;
  selectedNeuron: number;
  weights: number[][];
  biases: number[];
  denseStep: number;
  runningSum: number;
  currentMultiplication: number | null;
  neuronOutputs: (number | null)[];
  activatedOutputs: (number | null)[];
  // Controls
  onDenseLayerSizeChange: (size: number) => void;
  onSelectedNeuronChange: (neuron: number) => void;
  onStep: () => void;
  onTogglePlay: () => void;
  onReset: () => void;
  isPlaying: boolean;
  isDenseComplete: boolean;
  isNeuronComplete: boolean;
  // Activation
  denseActivationType: DenseActivationType;
  onDenseActivationTypeChange: (type: DenseActivationType) => void;
  // Status
  status: StageStatus;
  // Phase control
  onStartDense: () => void;
  phase: 'convolution' | 'activation' | 'pooling' | 'flatten' | 'dense';
  // Show top-k mode
  showTopK: boolean;
  onShowTopKChange: (show: boolean) => void;
  topK: number;
}

export function DenseLayerVisualization({
  flattenedVector,
  isFlattenComplete,
  denseLayerSize,
  selectedNeuron,
  weights,
  biases,
  denseStep,
  runningSum,
  currentMultiplication,
  neuronOutputs,
  activatedOutputs,
  onDenseLayerSizeChange,
  onSelectedNeuronChange,
  onStep,
  onTogglePlay,
  onReset,
  isPlaying,
  isDenseComplete,
  isNeuronComplete,
  denseActivationType,
  onDenseActivationTypeChange,
  status,
  onStartDense,
  phase,
  showTopK,
  onShowTopKChange,
  topK,
}: DenseLayerVisualizationProps) {
  // Track hover state
  const [hoveredInputIndex, setHoveredInputIndex] = useState<number | null>(null);
  const [hoveredWeightIndex, setHoveredWeightIndex] = useState<number | null>(null);

  const inputSize = flattenedVector.length;
  const currentWeights = weights[selectedNeuron] || [];
  const currentBias = biases[selectedNeuron] || 0;

  // Calculate which inputs have the most influence (for top-k display)
  const topInfluentialInputs = useMemo(() => {
    if (!currentWeights.length || !flattenedVector.length) return [];
    
    const influences = flattenedVector.map((val, idx) => ({
      index: idx,
      value: val,
      weight: currentWeights[idx] || 0,
      product: val * (currentWeights[idx] || 0),
      absProduct: Math.abs(val * (currentWeights[idx] || 0)),
    }));
    
    return influences.sort((a, b) => b.absProduct - a.absProduct).slice(0, topK);
  }, [flattenedVector, currentWeights, topK]);

  // Get color for values
  const getValueColor = (val: number | null, maxAbs: number): { bg: string; text: string } => {
    if (val === null || val === undefined) {
      return { bg: 'hsl(var(--muted))', text: 'hsl(var(--muted-foreground))' };
    }
    
    if (val === 0) {
      return { bg: 'hsl(0, 0%, 95%)', text: '#000000' };
    }
    
    const normalized = maxAbs > 0 ? val / maxAbs : 0;
    
    if (normalized >= 0) {
      const intensity = Math.min(1, Math.abs(normalized));
      const lightness = 95 - (intensity * 45);
      const textColor = lightness > 60 ? '#000000' : '#ffffff';
      return { bg: `hsl(142, 71%, ${lightness}%)`, text: textColor }; // Green for positive
    } else {
      const intensity = Math.min(1, Math.abs(normalized));
      const lightness = 95 - (intensity * 45);
      const textColor = lightness > 60 ? '#000000' : '#ffffff';
      return { bg: `hsl(0, 84%, ${lightness}%)`, text: textColor }; // Red for negative
    }
  };

  // Format value for display
  const formatValue = (val: number | null, decimals: number = 2): string => {
    if (val === null || val === undefined) return '-';
    if (val === 0) return '0';
    if (Math.abs(val) >= 1000) {
      return (val / 1000).toFixed(1) + 'k';
    }
    if (Math.abs(val) < 0.01) {
      return val.toExponential(1);
    }
    return val.toFixed(decimals);
  };

  // Get status badge styling
  const getStatusBadgeStyle = () => {
    switch (status) {
      case 'waiting':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'running':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  // Calculate max absolute values for color scaling
  const maxAbsInput = useMemo(() => {
    return Math.max(...flattenedVector.map(Math.abs), 1);
  }, [flattenedVector]);

  const maxAbsWeight = useMemo(() => {
    return Math.max(...currentWeights.map(Math.abs), 1);
  }, [currentWeights]);

  const canStartDense = isFlattenComplete && phase !== 'dense';
  const isInDensePhase = phase === 'dense';

  // Handler for Start Dense
  const handleStartDense = () => {
    onStartDense();
  };

  // Determine which inputs to display
  const displayIndices = useMemo(() => {
    if (!showTopK || inputSize <= topK) {
      return Array.from({ length: inputSize }, (_, i) => i);
    }
    return topInfluentialInputs.map(item => item.index);
  }, [showTopK, inputSize, topK, topInfluentialInputs]);

  return (
    <div className="bg-card rounded-lg border border-border shadow-sm overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-600 to-amber-600 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-white font-semibold">Fully Connected (Dense) Layer</h3>
          <span className={`px-2 py-0.5 text-xs font-medium rounded border ${getStatusBadgeStyle()}`}>
            {status === 'waiting' ? 'Waiting' : status === 'running' ? 'Running' : 'Completed'}
          </span>
        </div>
        <div className="text-white/80 text-sm">
          Neuron {selectedNeuron + 1} / {denseLayerSize}
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Controls Row 1: Layer Configuration */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-foreground whitespace-nowrap">
              Output Neurons:
            </label>
            <select
              value={denseLayerSize}
              onChange={(e) => onDenseLayerSizeChange(Number(e.target.value))}
              className="px-3 py-1.5 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              disabled={isPlaying || isInDensePhase}
            >
              {[5, 10, 16, 32].map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-foreground whitespace-nowrap">
              View Neuron:
            </label>
            <select
              value={selectedNeuron}
              onChange={(e) => onSelectedNeuronChange(Number(e.target.value))}
              className="px-3 py-1.5 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              disabled={isPlaying}
            >
              {Array.from({ length: denseLayerSize }, (_, i) => (
                <option key={i} value={i}>
                  Neuron {i + 1}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-foreground whitespace-nowrap">
              Activation:
            </label>
            <select
              value={denseActivationType}
              onChange={(e) => onDenseActivationTypeChange(e.target.value as DenseActivationType)}
              className="px-3 py-1.5 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              disabled={isPlaying}
            >
              {(Object.keys(DENSE_ACTIVATION_LABELS) as DenseActivationType[]).map((type) => (
                <option key={type} value={type}>
                  {DENSE_ACTIVATION_LABELS[type]}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Controls Row 2: Display Options */}
        {inputSize > topK && (
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showTopK}
                onChange={(e) => onShowTopKChange(e.target.checked)}
                className="rounded border-gray-300"
              />
              <span className="text-sm text-muted-foreground">
                Show Top-{topK} influential inputs only (input size: {inputSize})
              </span>
            </label>
          </div>
        )}

        {/* Activation description */}
        <p className="text-xs text-muted-foreground bg-muted/50 px-3 py-2 rounded-md">
          {DENSE_ACTIVATION_DESCRIPTIONS[denseActivationType]}
        </p>

        {/* Controls Row 3: Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {!isInDensePhase ? (
            <Button
              size="sm"
              onClick={handleStartDense}
              disabled={!canStartDense}
              className="gap-1"
              variant={canStartDense ? "default" : "outline"}
            >
              <PlayCircle className="w-4 h-4" />
              Start Dense
            </Button>
          ) : (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={onStep}
                disabled={isDenseComplete || isPlaying}
                className="gap-1"
              >
                <StepForward className="w-4 h-4" />
                Step
              </Button>
              
              <Button
                size="sm"
                variant="outline"
                onClick={onTogglePlay}
                disabled={isDenseComplete}
                className="gap-1"
              >
                {isPlaying ? (
                  <>
                    <Pause className="w-4 h-4" />
                    Pause
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    Play
                  </>
                )}
              </Button>
              
              <Button
                size="sm"
                variant="outline"
                onClick={onReset}
                className="gap-1"
              >
                <RotateCcw className="w-4 h-4" />
                Reset
              </Button>
            </>
          )}

          {/* Progress indicator */}
          {isInDensePhase && (
            <span className="text-sm text-muted-foreground ml-auto">
              Step {denseStep} / {inputSize} {isNeuronComplete && '(+ bias)'}
            </span>
          )}
        </div>

        {/* Main Visualization */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          {/* LEFT: Input Vector (Flattened) */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-foreground">
              Input Vector (x)
              {showTopK && inputSize > topK && (
                <span className="text-xs text-muted-foreground ml-2">
                  (Top-{topK} shown)
                </span>
              )}
            </h4>
            <div 
              style={{
                backgroundColor: 'hsl(var(--muted) / 0.3)',
                borderRadius: '0.5rem',
                padding: '0.75rem',
                overflowX: 'auto',
                overflowY: 'hidden',
                maxHeight: '200px',
              }}
            >
              <div 
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  flexWrap: 'nowrap',
                  gap: '2px',
                  width: 'max-content',
                }}
              >
                {displayIndices.map((idx) => {
                  const val = flattenedVector[idx];
                  const isActive = idx === denseStep && !isNeuronComplete;
                  const isProcessed = idx < denseStep;
                  const colors = getValueColor(val, maxAbsInput);
                  
                  return (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '2px',
                        opacity: isProcessed ? 0.4 : 1,
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: colors.bg,
                          color: colors.text,
                          width: '36px',
                          height: '28px',
                          borderRadius: '0.25rem',
                          fontSize: '0.65rem',
                          fontFamily: 'monospace',
                          cursor: 'pointer',
                          flexShrink: 0,
                          outline: isActive ? '3px solid #f97316' : 
                                   (hoveredInputIndex === idx ? '2px solid #facc15' : 'none'),
                          outlineOffset: '1px',
                          transform: isActive ? 'scale(1.15)' : 'none',
                          zIndex: isActive ? 10 : 'auto',
                          transition: 'all 150ms',
                        }}
                        onMouseEnter={() => setHoveredInputIndex(idx)}
                        onMouseLeave={() => setHoveredInputIndex(null)}
                        title={`x[${idx}] = ${formatValue(val, 4)}`}
                      >
                        {formatValue(val, 1)}
                      </div>
                      <span style={{ fontSize: '0.5rem', color: 'hsl(var(--muted-foreground))' }}>
                        {idx}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* CENTER: Weights for Selected Neuron */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-foreground">
              Weights (w) - Neuron {selectedNeuron + 1}
            </h4>
            <div 
              style={{
                backgroundColor: 'hsl(var(--muted) / 0.3)',
                borderRadius: '0.5rem',
                padding: '0.75rem',
                overflowX: 'auto',
                overflowY: 'hidden',
                maxHeight: '200px',
              }}
            >
              <div 
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  flexWrap: 'nowrap',
                  gap: '2px',
                  width: 'max-content',
                }}
              >
                {displayIndices.map((idx) => {
                  const weight = currentWeights[idx] || 0;
                  const isActive = idx === denseStep && !isNeuronComplete;
                  const isProcessed = idx < denseStep;
                  const colors = getValueColor(weight, maxAbsWeight);
                  
                  return (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '2px',
                        opacity: isProcessed ? 0.4 : 1,
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: colors.bg,
                          color: colors.text,
                          width: '36px',
                          height: '28px',
                          borderRadius: '0.25rem',
                          fontSize: '0.65rem',
                          fontFamily: 'monospace',
                          cursor: 'pointer',
                          flexShrink: 0,
                          outline: isActive ? '3px solid #f97316' : 
                                   (hoveredWeightIndex === idx ? '2px solid #facc15' : 'none'),
                          outlineOffset: '1px',
                          transform: isActive ? 'scale(1.15)' : 'none',
                          zIndex: isActive ? 10 : 'auto',
                          transition: 'all 150ms',
                        }}
                        onMouseEnter={() => setHoveredWeightIndex(idx)}
                        onMouseLeave={() => setHoveredWeightIndex(null)}
                        title={`w[${idx}] = ${formatValue(weight, 4)}`}
                      >
                        {formatValue(weight, 2)}
                      </div>
                      <span style={{ fontSize: '0.5rem', color: 'hsl(var(--muted-foreground))' }}>
                        {idx}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
            {/* Bias display */}
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Bias (b):</span>
              <span className="font-mono font-medium">{formatValue(currentBias, 4)}</span>
            </div>
          </div>

          {/* RIGHT: Computation Result */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-foreground">
              Computation
            </h4>
            
            {/* Current multiplication */}
            <div className="bg-muted/30 rounded-lg p-3 space-y-2">
              <div className="text-xs text-muted-foreground">Current Step:</div>
              {denseStep < inputSize && !isNeuronComplete ? (
                <div className="font-mono text-sm">
                  x[{denseStep}] × w[{denseStep}] = {formatValue(flattenedVector[denseStep], 2)} × {formatValue(currentWeights[denseStep], 2)}
                  <div className="text-orange-600 font-semibold mt-1">
                    = {formatValue(currentMultiplication, 4)}
                  </div>
                </div>
              ) : isNeuronComplete ? (
                <div className="font-mono text-sm text-green-600">
                  All multiplications complete!
                </div>
              ) : (
                <div className="text-muted-foreground text-sm">
                  Click Step or Play to begin
                </div>
              )}
            </div>

            {/* Running sum */}
            <div className="bg-muted/30 rounded-lg p-3 space-y-2">
              <div className="text-xs text-muted-foreground">Running Sum (Σ x_i × w_i):</div>
              <div className="font-mono text-lg font-semibold text-blue-600">
                {formatValue(runningSum, 4)}
              </div>
            </div>

            {/* Final output */}
            {isNeuronComplete && (
              <div className="bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20 border border-orange-200 dark:border-orange-800 rounded-lg p-3 space-y-2">
                <div className="text-xs text-muted-foreground">Final Output (y = Σ + b):</div>
                <div className="font-mono text-lg font-semibold">
                  {formatValue(runningSum, 4)} + {formatValue(currentBias, 4)} = 
                  <span className="text-orange-600 ml-2">
                    {formatValue(neuronOutputs[selectedNeuron], 4)}
                  </span>
                </div>
                {denseActivationType !== 'none' && activatedOutputs[selectedNeuron] !== null && (
                  <div className="mt-2 pt-2 border-t border-orange-200 dark:border-orange-700">
                    <div className="text-xs text-muted-foreground">
                      After {DENSE_ACTIVATION_LABELS[denseActivationType]}:
                    </div>
                    <div className="font-mono text-lg font-semibold text-green-600">
                      {formatValue(activatedOutputs[selectedNeuron], 4)}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* All Neuron Outputs */}
        {isDenseComplete && (
          <div className="space-y-2 pt-2 border-t border-border">
            <h4 className="text-sm font-medium text-foreground">
              All Neuron Outputs
              {denseActivationType !== 'none' && (
                <span className="text-xs text-muted-foreground ml-2">
                  (after {DENSE_ACTIVATION_LABELS[denseActivationType]})
                </span>
              )}
            </h4>
            <div 
              style={{
                display: 'flex',
                flexDirection: 'row',
                flexWrap: 'wrap',
                gap: '8px',
              }}
            >
              {(denseActivationType !== 'none' ? activatedOutputs : neuronOutputs).map((output, idx) => {
                const isSelected = idx === selectedNeuron;
                const maxOut = Math.max(...(denseActivationType !== 'none' ? activatedOutputs : neuronOutputs).filter(v => v !== null).map(v => Math.abs(v!)), 1);
                const colors = getValueColor(output, maxOut);
                
                return (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '4px',
                      cursor: 'pointer',
                    }}
                    onClick={() => onSelectedNeuronChange(idx)}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: colors.bg,
                        color: colors.text,
                        width: '50px',
                        height: '32px',
                        borderRadius: '0.25rem',
                        fontSize: '0.7rem',
                        fontFamily: 'monospace',
                        outline: isSelected ? '2px solid #f97316' : 'none',
                        outlineOffset: '2px',
                      }}
                      title={`Neuron ${idx + 1}: ${formatValue(output, 6)}`}
                    >
                      {formatValue(output, 3)}
                    </div>
                    <span style={{ fontSize: '0.6rem', color: 'hsl(var(--muted-foreground))' }}>
                      N{idx + 1}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Explanation Text */}
        <div className="bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
          <p className="text-sm text-foreground leading-relaxed">
            <strong>Dense (Fully Connected) Layer</strong> connects every input to every neuron.
            Each neuron computes: <strong className="font-mono">y = Σ(x_i × w_i) + b</strong>,
            where <em>x</em> is the input, <em>w</em> are learned weights, and <em>b</em> is the bias.
            This transforms spatial features into class predictions.
          </p>
          
          {/* Show current computation info */}
          {isInDensePhase && denseStep > 0 && denseStep <= inputSize && (
            <div className="mt-3 pt-3 border-t border-orange-200 dark:border-orange-800">
              <p className="text-sm text-orange-700 dark:text-orange-300 font-mono">
                Step {denseStep}: x[{denseStep - 1}] × w[{denseStep - 1}] = 
                {formatValue(flattenedVector[denseStep - 1], 2)} × {formatValue(currentWeights[denseStep - 1], 2)} = 
                {formatValue(flattenedVector[denseStep - 1] * (currentWeights[denseStep - 1] || 0), 4)}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
