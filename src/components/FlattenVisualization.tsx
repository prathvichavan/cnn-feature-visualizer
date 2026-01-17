import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Play, Pause, RotateCcw, StepForward, PlayCircle } from 'lucide-react';
import { FlattenSourceType } from '@/hooks/useCNNVisualization';

// Status type for display
type StageStatus = 'waiting' | 'running' | 'completed';

// Flatten source labels and descriptions for UI
const FLATTEN_SOURCE_LABELS: Record<FlattenSourceType, string> = {
  raw: 'Feature Map (Raw)',
  activated: 'Activated Feature Map',
  pooled: 'Pooled Output',
};

const FLATTEN_SOURCE_DESCRIPTIONS: Record<FlattenSourceType, string> = {
  raw: 'Flatten the raw convolution output before activation.',
  activated: 'Flatten the feature map after activation function.',
  pooled: 'Flatten the pooled output (recommended for typical CNN pipelines).',
};

interface FlattenVisualizationProps {
  // Source maps
  featureMap: (number | null)[][];
  activatedMap: (number | null)[][];
  pooledMap: (number | null)[][];
  // Flatten state
  flattenedVector: number[];
  flattenStep: number;
  totalFlattenSteps: number;
  currentFlattenRow: number;
  // Source selection
  flattenSource: FlattenSourceType;
  onFlattenSourceChange: (source: FlattenSourceType) => void;
  // Controls
  onStep: () => void;
  onTogglePlay: () => void;
  onReset: () => void;
  isPlaying: boolean;
  isFlattenComplete: boolean;
  // Status
  status: StageStatus;
  // Convolution complete check
  isConvolutionComplete: boolean;
  // Function to start flatten phase
  onStartFlatten: () => void;
  // Current phase
  phase: 'convolution' | 'activation' | 'pooling' | 'flatten' | 'dense';
}

export function FlattenVisualization({
  featureMap,
  activatedMap,
  pooledMap,
  flattenedVector,
  flattenStep,
  totalFlattenSteps,
  currentFlattenRow,
  flattenSource,
  onFlattenSourceChange,
  onStep,
  onTogglePlay,
  onReset,
  isPlaying,
  isFlattenComplete,
  status,
  isConvolutionComplete,
  onStartFlatten,
  phase,
}: FlattenVisualizationProps) {
  // Track hover state for bidirectional highlighting
  const [hoveredVectorIndex, setHoveredVectorIndex] = useState<number | null>(null);
  const [hoveredGridCell, setHoveredGridCell] = useState<{ row: number; col: number } | null>(null);

  // Get source size - use totalFlattenSteps which is always correct from the hook
  const sourceSize = totalFlattenSteps;
  const totalCells = sourceSize * sourceSize;

  // Get the source map based on flattenSource, ensuring correct size
  const sourceMap = useMemo(() => {
    let rawMap: (number | null)[][] = [];
    
    switch (flattenSource) {
      case 'raw':
        rawMap = featureMap;
        break;
      case 'activated':
        rawMap = activatedMap;
        break;
      case 'pooled':
        rawMap = pooledMap;
        break;
      default:
        rawMap = pooledMap;
    }
    
    // Ensure the map has the correct dimensions
    if (rawMap.length !== sourceSize || (rawMap.length > 0 && rawMap[0].length !== sourceSize)) {
      // Create properly sized array with null values
      return Array(sourceSize).fill(null).map(() => Array(sourceSize).fill(null));
    }
    
    return rawMap;
  }, [flattenSource, featureMap, activatedMap, pooledMap, sourceSize]);

  // Calculate min/max for color scaling
  const { minVal, maxVal } = useMemo(() => {
    let min = 0;
    let max = 0;
    sourceMap.forEach(row => {
      row.forEach(val => {
        if (val !== null && val !== undefined) {
          min = Math.min(min, val);
          max = Math.max(max, val);
        }
      });
    });
    return { minVal: min, maxVal: max };
  }, [sourceMap]);

  // Get color based on value - only color non-zero values
  const getColor = (val: number | null): { bg: string; text: string } => {
    if (val === null || val === undefined) {
      return { bg: 'hsl(var(--muted))', text: 'hsl(var(--muted-foreground))' };
    }
    
    // Zero values: neutral background
    if (val === 0) {
      return { bg: 'hsl(0, 0%, 95%)', text: '#000000' };
    }
    
    const absMax = Math.max(Math.abs(minVal), Math.abs(maxVal)) || 1;
    const normalized = val / absMax;
    
    if (normalized >= 0) {
      // Positive: red shades
      const intensity = Math.min(1, Math.abs(normalized));
      const lightness = 95 - (intensity * 45);
      const textColor = lightness > 60 ? '#000000' : '#ffffff';
      return { bg: `hsl(0, 84%, ${lightness}%)`, text: textColor };
    } else {
      // Negative: blue shades
      const intensity = Math.min(1, Math.abs(normalized));
      const lightness = 95 - (intensity * 45);
      const textColor = lightness > 60 ? '#000000' : '#ffffff';
      return { bg: `hsl(217, 91%, ${lightness}%)`, text: textColor };
    }
  };

  // Format value for display
  const formatValue = (val: number | null): string => {
    if (val === null || val === undefined) return '';
    if (val === 0) return '0';
    // For very small values (sigmoid output), show decimals
    if (Math.abs(val) < 1) {
      return val.toFixed(2);
    }
    if (Math.abs(val) >= 1000) {
      return (val / 1000).toFixed(0) + 'k';
    }
    return Math.round(val).toString();
  };

  // Convert vector index to 2D grid position (row-major order)
  const indexToGridPosition = (index: number): { row: number; col: number } => {
    const row = Math.floor(index / sourceSize);
    const col = index % sourceSize;
    return { row, col };
  };

  // Convert 2D grid position to vector index
  const gridPositionToIndex = (row: number, col: number): number => {
    return row * sourceSize + col;
  };

  // Check if a grid cell should be highlighted
  const isCellHighlighted = (row: number, col: number): boolean => {
    // Highlight if hovered from vector
    if (hoveredVectorIndex !== null) {
      const pos = indexToGridPosition(hoveredVectorIndex);
      return pos.row === row && pos.col === col;
    }
    // Highlight if directly hovered on grid
    if (hoveredGridCell !== null) {
      return hoveredGridCell.row === row && hoveredGridCell.col === col;
    }
    return false;
  };

  // Check if a vector cell should be highlighted
  const isVectorCellHighlighted = (index: number): boolean => {
    if (hoveredVectorIndex === index) return true;
    if (hoveredGridCell !== null) {
      const expectedIndex = gridPositionToIndex(hoveredGridCell.row, hoveredGridCell.col);
      return expectedIndex === index;
    }
    return false;
  };

  // Check if a row is currently being flattened
  const isRowBeingFlattened = (row: number): boolean => {
    return row === currentFlattenRow && !isFlattenComplete;
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

  // Calculate completed cells
  const completedCells = flattenedVector.length;

  // Check if flatten can be started
  const canStartFlatten = isConvolutionComplete;
  const isInFlattenPhase = phase === 'flatten';

  // Handler for Start Flatten that ensures phase is set
  const handleStartFlatten = () => {
    onStartFlatten();
  };

  return (
    <div className="section-frame module bg-card overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-foreground">Flatten Layer</h3>
          <span className={`px-2 py-0.5 text-xs font-medium rounded border ${getStatusBadgeStyle()}`}>
            {status === 'waiting' ? 'Waiting' : status === 'running' ? 'Running' : 'Completed'}
          </span>
        </div>
        <div className="text-sm text-muted-foreground">
          {completedCells} / {totalCells} values
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Flatten Source Control */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <label className="text-sm font-medium text-foreground whitespace-nowrap">
            Flatten Source:
          </label>
          <select
            value={flattenSource}
            onChange={(e) => onFlattenSourceChange(e.target.value as FlattenSourceType)}
            className="flex-1 px-3 py-2 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            disabled={isPlaying}
          >
            {(Object.keys(FLATTEN_SOURCE_LABELS) as FlattenSourceType[]).map((source) => (
              <option key={source} value={source}>
                {FLATTEN_SOURCE_LABELS[source]}
              </option>
            ))}
          </select>
        </div>

        {/* Source description */}
        <p className="text-xs text-muted-foreground bg-muted/50 px-3 py-2 rounded-md">
          {FLATTEN_SOURCE_DESCRIPTIONS[flattenSource]}
        </p>

        {/* Controls - Always show all buttons when convolution is complete */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Start Flatten button - only when not in flatten phase yet */}
          {!isInFlattenPhase ? (
            <Button
              size="sm"
              onClick={handleStartFlatten}
              disabled={!canStartFlatten}
              className="gap-1"
              variant={canStartFlatten ? "default" : "outline"}
            >
              <PlayCircle className="w-4 h-4" />
              Start Flatten
            </Button>
          ) : (
            /* Step/Play/Reset controls - show when in flatten phase */
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={onStep}
                disabled={isFlattenComplete || isPlaying}
                className="gap-1"
              >
                <StepForward className="w-4 h-4" />
                Step
              </Button>
              
              <Button
                size="sm"
                variant="outline"
                onClick={onTogglePlay}
                disabled={isFlattenComplete}
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
          {isInFlattenPhase && (
            <span className="text-sm text-muted-foreground ml-auto">
              Row {currentFlattenRow + 1} of {sourceSize}
            </span>
          )}
        </div>

        {/* Main Visualization - Side by Side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* LEFT: 2D Source Grid */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-foreground">
              2D Source ({FLATTEN_SOURCE_LABELS[flattenSource]})
            </h4>
            <div className="bg-muted/30 rounded-lg p-3 overflow-auto">
              <div 
                className="grid gap-0.5 mx-auto"
                style={{ 
                  gridTemplateColumns: `repeat(${sourceSize}, minmax(0, 1fr))`,
                  maxWidth: `${Math.min(sourceSize * 40, 400)}px`
                }}
              >
                {sourceMap.map((row, rowIdx) =>
                  row.map((val, colIdx) => {
                    const colors = getColor(val);
                    const isHighlighted = isCellHighlighted(rowIdx, colIdx);
                    const isCurrentRow = isRowBeingFlattened(rowIdx);
                    const cellIndex = gridPositionToIndex(rowIdx, colIdx);
                    const isFlattenedAlready = cellIndex < flattenedVector.length;
                    
                    return (
                      <div
                        key={`${rowIdx}-${colIdx}`}
                        className={`
                          aspect-square flex items-center justify-center text-xs font-mono
                          rounded-sm cursor-pointer transition-all duration-150
                          ${isHighlighted ? 'ring-2 ring-yellow-400 ring-offset-1 scale-110 z-10' : ''}
                          ${isCurrentRow && !isFlattenedAlready ? 'ring-1 ring-purple-400' : ''}
                          ${isFlattenedAlready ? 'opacity-60' : ''}
                        `}
                        style={{ 
                          backgroundColor: colors.bg, 
                          color: colors.text,
                          minWidth: '24px',
                          minHeight: '24px',
                        }}
                        onMouseEnter={() => setHoveredGridCell({ row: rowIdx, col: colIdx })}
                        onMouseLeave={() => setHoveredGridCell(null)}
                        title={`Position (${rowIdx}, ${colIdx}) → Index ${cellIndex}`}
                      >
                        {sourceSize <= 13 ? formatValue(val) : ''}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
            
            {/* Grid legend */}
            <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-sm ring-1 ring-purple-400"></div>
                <span>Current row</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-sm opacity-60 bg-gray-300"></div>
                <span>Flattened</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-sm ring-2 ring-yellow-400"></div>
                <span>Hovered</span>
              </div>
            </div>
          </div>

          {/* RIGHT: 1D Flattened Vector */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-foreground">
              1D Flattened Vector
            </h4>
            {/* 
              STRICT 1D VISUALIZATION CONTAINER
              - Single horizontal row only
              - No wrapping allowed
              - Horizontal scroll for overflow
            */}
            <div 
              style={{
                backgroundColor: 'hsl(var(--muted) / 0.3)',
                borderRadius: '0.5rem',
                padding: '0.75rem',
                overflowX: 'auto',
                overflowY: 'hidden',
                whiteSpace: 'nowrap',
              }}
            >
              {flattenedVector.length === 0 ? (
                <div className="text-center text-muted-foreground text-sm py-8">
                  No values flattened yet. Use Step or Play to begin.
                </div>
              ) : (
                /* 
                  TRUE 1D VECTOR: SINGLE ROW, NO WRAPPING
                  - display: flex
                  - flex-direction: row
                  - flex-wrap: nowrap
                  - All children are direct, no nesting
                */
                <div 
                  style={{
                    display: 'flex',
                    flexDirection: 'row',
                    flexWrap: 'nowrap',
                    gap: '4px',
                    width: 'max-content',
                    minHeight: '36px',
                    alignItems: 'center',
                  }}
                >
                  {flattenedVector.map((val, index) => {
                    const colors = getColor(val);
                    const isHighlighted = isVectorCellHighlighted(index);
                    const gridPos = indexToGridPosition(index);
                    
                    return (
                      <div
                        key={index}
                        style={{ 
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: colors.bg, 
                          color: colors.text,
                          width: '32px',
                          height: '28px',
                          padding: '2px 4px',
                          borderRadius: '0.125rem',
                          fontSize: '0.75rem',
                          fontFamily: 'monospace',
                          cursor: 'pointer',
                          flexShrink: 0,
                          boxSizing: 'border-box',
                          outline: isHighlighted ? '2px solid #facc15' : 'none',
                          outlineOffset: isHighlighted ? '1px' : '0',
                          transform: isHighlighted ? 'scale(1.1)' : 'none',
                          zIndex: isHighlighted ? 10 : 'auto',
                          transition: 'all 150ms',
                        }}
                        onMouseEnter={() => setHoveredVectorIndex(index)}
                        onMouseLeave={() => setHoveredVectorIndex(null)}
                        title={`Index ${index} ← Position (${gridPos.row}, ${gridPos.col})`}
                      >
                        {formatValue(val)}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            
            {/* Vector info */}
            {flattenedVector.length > 0 && (
              <div className="text-xs text-muted-foreground">
                Vector length: {flattenedVector.length} / {totalCells}
                {isFlattenComplete && (
                  <span className="ml-2 text-green-600 font-medium">✓ Complete</span>
                )}
              </div>
            )}
            
            {/* Scroll hint */}
            {flattenedVector.length > 6 && (
              <p className="text-xs text-muted-foreground italic">
                ← Scroll horizontally to see all values →
              </p>
            )}
          </div>
        </div>

        {/* Explanation Text */}
        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-950/20 dark:to-indigo-950/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
          <p className="text-sm text-foreground leading-relaxed">
            <strong>Flatten</strong> converts a 2D feature map into a <strong>single 1D sequence</strong> so it can be fed into 
            fully connected (dense) layers. Values are extracted in <strong>row-major order</strong> — 
            reading left to right, top to bottom. This transformation <strong>removes spatial structure</strong> while 
            preserving all information, enabling the network to learn global patterns.
          </p>
          
          {/* Show mapping info on hover */}
          {(hoveredVectorIndex !== null || hoveredGridCell !== null) && (
            <div className="mt-3 pt-3 border-t border-purple-200 dark:border-purple-800">
              {hoveredVectorIndex !== null && (
                <p className="text-sm text-purple-700 dark:text-purple-300">
                  <strong>Vector Index {hoveredVectorIndex}</strong> ← 
                  Grid Position ({indexToGridPosition(hoveredVectorIndex).row}, {indexToGridPosition(hoveredVectorIndex).col})
                </p>
              )}
              {hoveredGridCell !== null && (
                <p className="text-sm text-purple-700 dark:text-purple-300">
                  <strong>Grid ({hoveredGridCell.row}, {hoveredGridCell.col})</strong> → 
                  Vector Index {gridPositionToIndex(hoveredGridCell.row, hoveredGridCell.col)}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
