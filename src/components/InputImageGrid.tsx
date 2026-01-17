import { useMemo } from 'react';
import { ConvolutionStep } from '@/hooks/useCNNVisualization';

// Type for advanced convolution highlight from parent
interface ConvolutionHighlight {
  featureMapRow: number;
  featureMapCol: number;
  inputWindow: { row: number; col: number }; // top-left of 3x3 window
  dominantCellPosition: { row: number; col: number }; // exact cell with max contribution
}

interface InputImageGridProps {
  image: number[][];
  currentStep: ConvolutionStep | null;
  phase: 'convolution' | 'activation' | 'pooling' | 'flatten' | 'dense';
  highlightRegion?: { row: number; col: number } | null;
  convolutionHighlight?: ConvolutionHighlight | null; // Advanced highlight with dominant cell
  // NEW: Padding support
  padding: number;
  stride: number;
  paddedInputSize: number;
  originalInputSize: number;
}

export function InputImageGrid({ 
  image, 
  currentStep, 
  phase, 
  highlightRegion, 
  convolutionHighlight,
  padding,
  stride,
  paddedInputSize,
  originalInputSize 
}: InputImageGridProps) {
  // Check if a cell is a padding cell (outside the original 28x28 region)
  const isPaddingCell = (row: number, col: number): boolean => {
    if (padding === 0) return false;
    // Padding cells are those in the padding border region
    return (
      row < padding || 
      row >= padding + originalInputSize || 
      col < padding || 
      col >= padding + originalInputSize
    );
  };

  // Highlighted region for interactive feature - now uses convolutionHighlight primarily
  // Updated to use stride when calculating input window position
  const highlightedCells = useMemo(() => {
    // Priority 1: Use convolutionHighlight from feature map hover (works in any phase)
    if (convolutionHighlight) {
      const cells = new Set<string>();
      // Calculate input window position using stride
      const startRow = convolutionHighlight.featureMapRow * stride;
      const startCol = convolutionHighlight.featureMapCol * stride;
      for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
          cells.add(`${startRow + i}-${startCol + j}`);
        }
      }
      return cells;
    }
    
    // Priority 2: Use highlightRegion if provided
    if (highlightRegion) {
      const cells = new Set<string>();
      const startRow = highlightRegion.row * stride;
      const startCol = highlightRegion.col * stride;
      for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
          cells.add(`${startRow + i}-${startCol + j}`);
        }
      }
      return cells;
    }
    
    // Priority 3: Fallback to currentStep during convolution phase
    if (currentStep && phase === 'convolution') {
      const cells = new Set<string>();
      const startRow = currentStep.row * stride;
      const startCol = currentStep.col * stride;
      for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
          cells.add(`${startRow + i}-${startCol + j}`);
        }
      }
      return cells;
    }
    
    return new Set<string>();
  }, [convolutionHighlight, highlightRegion, currentStep, phase, stride]);

  // Check if a cell is the DOMINANT contributing cell
  const isDominantCell = (row: number, col: number): boolean => {
    if (!convolutionHighlight) return false;
    // Recalculate dominant position considering stride
    const startRow = convolutionHighlight.featureMapRow * stride;
    const startCol = convolutionHighlight.featureMapCol * stride;
    const { dominantCellPosition } = convolutionHighlight;
    // Adjust dominant cell position if we're using stride
    const adjustedDominantRow = startRow + (dominantCellPosition.row - convolutionHighlight.inputWindow.row);
    const adjustedDominantCol = startCol + (dominantCellPosition.col - convolutionHighlight.inputWindow.col);
    return row === adjustedDominantRow && col === adjustedDominantCol;
  };

  // Get contrasting text color based on background brightness
  const getTextColor = (grayValue: number) => {
    return grayValue > 127 ? '#000000' : '#ffffff';
  };

  // Calculate cell size based on grid size (smaller cells for larger grids)
  const cellSize = paddedInputSize <= 28 ? 14 : paddedInputSize <= 30 ? 12 : 11;

  return (
    <div className="section-frame module bg-card">
      <h3 className="text-sm font-semibold text-foreground mb-1">
        Input Image ({paddedInputSize}×{paddedInputSize})
        {padding > 0 && (
          <span className="ml-2 text-xs font-normal text-muted-foreground">
            (28×28 + padding={padding})
          </span>
        )}
      </h3>
      <p className="text-xs text-muted-foreground mb-2">
        Each cell represents one pixel.
        {padding > 0 && " Dashed border = padding pixels (value 0)."}
      </p>
      
      <div className="flex justify-center overflow-auto">
        <div 
          className="inline-grid data-area"
          style={{ 
            gridTemplateColumns: `repeat(${paddedInputSize}, ${cellSize}px)`,
            gap: '1px',
            padding: '1px',
          }}
        >
          {image.map((row, rowIdx) =>
            row.map((pixel, colIdx) => {
              const key = `${rowIdx}-${colIdx}`;
              const isHighlighted = highlightedCells.has(key);
              const isDominant = isDominantCell(rowIdx, colIdx);
              const isPadding = isPaddingCell(rowIdx, colIdx);
              const grayValue = Math.round(pixel);
              const textColor = getTextColor(grayValue);
              
              // Determine cell styling
              let cellStyle: React.CSSProperties = {
                width: `${cellSize}px`,
                height: `${cellSize}px`,
                backgroundColor: `rgb(${grayValue}, ${grayValue}, ${grayValue})`,
                color: textColor,
                fontSize: cellSize <= 12 ? '4px' : '5px',
                fontFamily: 'monospace',
                fontWeight: 600,
                lineHeight: 1,
              };

              // If this is a padding cell, show distinctive style
              if (isPadding) {
                cellStyle = {
                  ...cellStyle,
                  backgroundColor: '#f0f4f8', // Light neutral background
                  color: '#94a3b8', // Muted text color
                  border: '1px dashed #cbd5e1', // Dashed border to indicate padding
                };
              }

              // If this is the DOMINANT contributing cell, use the single accent for emphasis
              if (isDominant) {
                cellStyle = {
                  ...cellStyle,
                  backgroundColor: 'hsl(var(--secondary))',
                  color: 'hsl(var(--accent-foreground))',
                  border: `2px solid hsl(var(--accent))`,
                  fontWeight: 800,
                };
              } else if (isHighlighted) {
                // Part of 3x3 window - subtle accent overlay
                cellStyle = {
                  ...cellStyle,
                  backgroundColor: isPadding ? 'rgba(99,102,241,0.06)' : 'rgba(99,102,241,0.08)',
                  color: '#000000',
                  border: `1px solid hsl(var(--accent) / 0.6)`,
                  fontWeight: 700,
                };
              }
              
              return (
                <div
                  key={key}
                  className={`flex items-center justify-center transition-all duration-75 ${
                    isHighlighted ? 'z-10' : ''
                  } ${isDominant ? 'z-20 scale-125' : isHighlighted ? 'scale-105' : ''}`}
                  style={cellStyle}
                >
                  {grayValue}
                </div>
              );
            })
          )}
        </div>
      </div>
      
      {/* Legend */}
      <div className="flex items-center justify-center gap-4 text-xs mt-2 flex-wrap">
        <div className="flex items-center gap-1">
          <div 
            className="w-4 h-4 border border-border flex items-center justify-center text-white font-mono"
            style={{ backgroundColor: 'rgb(0,0,0)', fontSize: '6px' }}
          >
            0
          </div>
          <span className="text-muted-foreground">Black</span>
        </div>
        <div className="flex items-center gap-1">
          <div 
            className="w-4 h-4 border border-border flex items-center justify-center text-black font-mono"
            style={{ backgroundColor: 'rgb(128,128,128)', fontSize: '6px' }}
          >
            128
          </div>
          <span className="text-muted-foreground">Mid</span>
        </div>
        <div className="flex items-center gap-1">
          <div 
            className="w-4 h-4 border border-border flex items-center justify-center text-black font-mono"
            style={{ backgroundColor: 'rgb(255,255,255)', fontSize: '6px' }}
          >
            255
          </div>
          <span className="text-muted-foreground">White</span>
        </div>
        {padding > 0 && (
          <div className="flex items-center gap-1">
            <div 
              className="w-4 h-4 flex items-center justify-center font-mono"
              style={{ 
                backgroundColor: '#f0f4f8', 
                border: '1px dashed #cbd5e1',
                color: '#94a3b8',
                fontSize: '6px' 
              }}
            >
              0
            </div>
            <span className="text-muted-foreground">Padding</span>
          </div>
        )}
      </div>
    </div>
  );
}
