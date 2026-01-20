import { useMemo, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Play, Pause, RotateCcw, StepForward, PlayCircle, Trophy } from 'lucide-react';

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

  // Calculate predicted neuron (argmax of softmax probabilities)
  const predictedNeuron = useMemo(() => {
    if (denseActivationType !== 'softmax' || !isDenseComplete) return null;
    if (!activatedOutputs.length || activatedOutputs.every(v => v === null)) return null;
    
    let maxIdx = 0;
    let maxVal = -Infinity;
    activatedOutputs.forEach((val, idx) => {
      if (val !== null && val > maxVal) {
        maxVal = val;
        maxIdx = idx;
      }
    });
    return maxIdx;
  }, [activatedOutputs, denseActivationType, isDenseComplete]);

  // Auto-select predicted neuron when softmax completes
  useEffect(() => {
    if (predictedNeuron !== null && isDenseComplete && denseActivationType === 'softmax') {
      onSelectedNeuronChange(predictedNeuron);
    }
  }, [predictedNeuron, isDenseComplete, denseActivationType]);

  // Check if user is inspecting a non-predicted neuron
  const isInspectingNonPredicted = predictedNeuron !== null && selectedNeuron !== predictedNeuron;

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

  // Get color for values (red=pos, blue=neg, gray=zero)
  const getValueColor = (val: number | null, maxAbs: number): { bg: string; text: string } => {
    if (val === null || val === undefined) {
      return { bg: 'hsl(var(--muted))', text: 'hsl(var(--muted-foreground))' };
    }
    if (val === 0) {
      return { bg: 'hsl(0, 0%, 95%)', text: '#000000' };
    }
    const normalized = maxAbs > 0 ? val / maxAbs : 0;
    if (normalized > 0) {
      // Positive: red
      const intensity = Math.min(1, Math.abs(normalized));
      const lightness = 95 - (intensity * 45);
      const textColor = lightness > 60 ? '#000000' : '#ffffff';
      return { bg: `hsl(0, 84%, ${lightness}%)`, text: textColor };
    } else {
      // Negative: blue
      const intensity = Math.min(1, Math.abs(normalized));
      const lightness = 95 - (intensity * 45);
      const textColor = lightness > 60 ? '#000000' : '#ffffff';
      return { bg: `hsl(217, 91%, ${lightness}%)`, text: textColor };
    }
  };

  // Format value for display (2 decimals for grid)
  const formatValue = (val: number | null, decimals: number = 2): string => {
    if (val === null || val === undefined) return '';
    if (val === 0) return '0.00';
    return val.toFixed(decimals);
  };
  // --- 2D Source Grid Renderer (used for both raw and activated feature maps) ---
  const render2DSourceGrid = (map: number[][], label: string) => {
    if (!map || !map.length) return null;
    const size = map.length;
    // Find min/max for color scaling
    let min = 0, max = 0;
    map.forEach(row => row.forEach(val => {
      if (val !== null && val !== undefined) {
        min = Math.min(min, val);
        max = Math.max(max, val);
      }
    }));
    const absMax = Math.max(Math.abs(min), Math.abs(max), 1);
    return (
      <div className="mb-4">
        <h4 className="text-xs font-semibold text-foreground mb-1">{label}</h4>
        <div className="inline-grid" style={{ gridTemplateColumns: `repeat(${size}, 1.5rem)`, gap: '2px', borderRadius: '0.5rem', overflow: 'hidden', background: 'hsl(var(--muted) / 0.2)' }}>
          {map.map((row, rowIdx) =>
            row.map((val, colIdx) => {
              const { bg, text } = getValueColor(val, absMax);
              return (
                <div
                  key={`${rowIdx}-${colIdx}`}
                  style={{
                    width: '1.5rem', height: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: bg, color: text, fontSize: '0.7rem', fontFamily: 'monospace', fontWeight: 600,
                    border: '1px solid #e5e7eb', textAlign: 'center',
                  }}
                  title={`(${rowIdx},${colIdx}): ${formatValue(val, 2)}`}
                >
                  {formatValue(val, 2)}
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  };

  // Get status badge styling
  const getStatusBadgeStyle = () => {
    switch (status) {
        {/* Main Visualization */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          {/* LEFT: 2D Source (Activated Feature Map) */}
          <div className="space-y-2">
            {render2DSourceGrid(
              (typeof window !== 'undefined' && (window as any).activatedFeatureMap2D) ? (window as any).activatedFeatureMap2D : (props as any).activatedFeatureMap2D || (props as any).activatedFeatureMap || [],
              '2D Source (Activated Feature Map)'
            )}
          </div>
          {/* CENTER: 2D Source (Feature Map - Raw) */}
          <div className="space-y-2">
            {render2DSourceGrid(
              (typeof window !== 'undefined' && (window as any).rawFeatureMap2D) ? (window as any).rawFeatureMap2D : (props as any).rawFeatureMap2D || (props as any).rawFeatureMap || [],
              '2D Source (Feature Map - Raw)'
            )}
          </div>
          {/* RIGHT: Computation Result (unchanged) */}
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
                    {/* Softmax explanatory note */}
                    {denseActivationType === 'softmax' && (
                      <p className="mt-2 text-xs text-muted-foreground italic leading-relaxed">
                        Softmax is computed across <strong>all</strong> output neurons.
                        This value represents the probability of the selected neuron
                        relative to the other neurons.
                      </p>
                    )}
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
                const isPredicted = idx === predictedNeuron;
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
                      position: 'relative',
                    }}
                    onClick={() => onSelectedNeuronChange(idx)}
                  >
                    {/* Predicted badge */}
                    {isPredicted && denseActivationType === 'softmax' && (
                      <div 
                        style={{
                          position: 'absolute',
                          top: '-8px',
                          right: '-4px',
                          backgroundColor: '#22c55e',
                          borderRadius: '9999px',
                          padding: '2px',
                          zIndex: 10,
                        }}
                        title="Predicted Output"
                      >
                        <Trophy style={{ width: '10px', height: '10px', color: 'white' }} />
                      </div>
                    )}
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
                        outline: isSelected 
                          ? '2px solid #f97316' 
                          : isPredicted && denseActivationType === 'softmax'
                            ? '2px solid #22c55e'
                            : 'none',
                        outlineOffset: '2px',
                      }}
                      title={`Neuron ${idx + 1}: ${formatValue(output, 6)}${isPredicted ? ' (Predicted)' : ''}`}
                    >
                      {formatValue(output, 3)}
                    </div>
                    <span style={{ 
                      fontSize: '0.6rem', 
                      color: isPredicted ? '#22c55e' : 'hsl(var(--muted-foreground))',
                      fontWeight: isPredicted ? 600 : 400,
                    }}>
                      N{idx + 1}{isPredicted && denseActivationType === 'softmax' ? ' ★' : ''}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Softmax Context: Logits vs Probabilities Table */}
        {isDenseComplete && denseActivationType === 'softmax' && (
          <div className="space-y-2 pt-2 border-t border-border">
            <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
              Softmax Probability Distribution
              {predictedNeuron !== null && (
                <span className="text-xs font-normal bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 px-2 py-0.5 rounded flex items-center gap-1">
                  <Trophy className="w-3 h-3" />
                  Predicted: Neuron {predictedNeuron + 1}
                </span>
              )}
            </h4>
            <p className="text-xs text-muted-foreground mb-2">
              After Softmax, the neuron with the highest probability is selected as the predicted output.
            </p>
            <div className="bg-muted/20 rounded-lg border border-border overflow-hidden">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-muted/40 border-b border-border">
                    <th className="px-3 py-2 text-left font-medium text-muted-foreground">Neuron</th>
                    <th className="px-3 py-2 text-right font-medium text-muted-foreground">Probability</th>
                  </tr>
                </thead>
                <tbody>
                  {neuronOutputs.map((logit, idx) => {
                    const prob = activatedOutputs[idx];
                    const isSelected = idx === selectedNeuron;
                    const isPredicted = idx === predictedNeuron;
                    return (
                      <tr 
                        key={idx} 
                        className={`border-b border-border/50 cursor-pointer hover:bg-muted/30 transition-colors ${
                          isPredicted 
                            ? 'bg-green-50 dark:bg-green-950/30 border-l-2 border-l-green-500' 
                            : isSelected 
                              ? 'bg-orange-50 dark:bg-orange-950/30 border-l-2 border-l-orange-400' 
                              : ''
                        }`}
                        onClick={() => onSelectedNeuronChange(idx)}
                      >
                        <td className="px-3 py-1.5">
                          <span className={`font-medium ${isPredicted ? 'text-green-600 font-semibold' : isSelected ? 'text-orange-600' : 'text-foreground'}`}>
                            Neuron {idx + 1}
                            {isPredicted && (
                              <span className="ml-1 inline-flex items-center gap-0.5 text-[10px] bg-green-500 text-white px-1 rounded">
                                <Trophy className="w-2.5 h-2.5" /> Predicted
                              </span>
                            )}
                            {isSelected && !isPredicted && <span className="ml-1 text-[10px] text-orange-500">← inspecting</span>}
                          </span>
                        </td>
                        <td className="px-3 py-1.5 text-right">
                          <span className={`font-mono font-semibold ${
                            isPredicted ? 'text-green-600' : isSelected ? 'text-orange-600' : 'text-muted-foreground'
                          }`}>
                            {prob !== null && prob !== undefined 
                              ? (prob < 0.0001 && prob > 0 
                                  ? prob.toExponential(2) 
                                  : prob.toFixed(4))
                              : '-'
                            }
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="bg-muted/40">
                    <td className="px-3 py-2 font-medium text-muted-foreground">Total (Σ)</td>
                    <td className="px-3 py-2 text-right font-mono font-semibold text-foreground">
                      {activatedOutputs.filter(v => v !== null).length > 0 
                        ? '1.0000' 
                        : '-'
                      }
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
            <p className="text-xs text-muted-foreground italic">
              All probabilities sum to 1. Click any row to inspect that neuron's computation.
            </p>
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
