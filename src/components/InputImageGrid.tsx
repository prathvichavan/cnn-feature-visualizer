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
  phase: 'convolution' | 'pooling';
  highlightRegion?: { row: number; col: number } | null;
  convolutionHighlight?: ConvolutionHighlight | null; // Advanced highlight with dominant cell
}

export function InputImageGrid({ image, currentStep, phase, highlightRegion, convolutionHighlight }: InputImageGridProps) {
  // Highlighted region for interactive feature - now uses convolutionHighlight primarily
  const highlightedCells = useMemo(() => {
    // Priority 1: Use convolutionHighlight from feature map hover (works in any phase)
    if (convolutionHighlight) {
      const cells = new Set<string>();
      const { inputWindow } = convolutionHighlight;
      for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
          cells.add(`${inputWindow.row + i}-${inputWindow.col + j}`);
        }
      }
      return cells;
    }
    
    // Priority 2: Use highlightRegion if provided
    if (highlightRegion) {
      const cells = new Set<string>();
      for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
          cells.add(`${highlightRegion.row + i}-${highlightRegion.col + j}`);
        }
      }
      return cells;
    }
    
    // Priority 3: Fallback to currentStep during convolution phase
    if (currentStep && phase === 'convolution') {
      const cells = new Set<string>();
      for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
          cells.add(`${currentStep.row + i}-${currentStep.col + j}`);
        }
      }
      return cells;
    }
    
    return new Set<string>();
  }, [convolutionHighlight, highlightRegion, currentStep, phase]);

  // Check if a cell is the DOMINANT contributing cell
  const isDominantCell = (row: number, col: number): boolean => {
    if (!convolutionHighlight) return false;
    const { dominantCellPosition } = convolutionHighlight;
    return row === dominantCellPosition.row && col === dominantCellPosition.col;
  };

  // Get contrasting text color based on background brightness
  const getTextColor = (grayValue: number) => {
    return grayValue > 127 ? '#000000' : '#ffffff';
  };

  return (
    <div className="bg-card rounded-lg border border-border shadow-sm p-2">
      <h3 className="text-sm font-semibold text-foreground mb-1">Input Image (28×28)</h3>
      <p className="text-xs text-muted-foreground mb-2">
        Each cell represents one MNIST pixel.
      </p>
      
      <div className="flex justify-center overflow-auto">
        <div 
          className="inline-grid bg-border"
          style={{ 
            gridTemplateColumns: `repeat(28, 14px)`,
            gap: '1px',
            padding: '1px',
          }}
        >
          {image.map((row, rowIdx) =>
            row.map((pixel, colIdx) => {
              const key = `${rowIdx}-${colIdx}`;
              const isHighlighted = highlightedCells.has(key);
              const isDominant = isDominantCell(rowIdx, colIdx);
              const grayValue = Math.round(pixel);
              const textColor = getTextColor(grayValue);
              
              // Determine cell styling
              let cellStyle: React.CSSProperties = {
                width: '14px',
                height: '14px',
                backgroundColor: `rgb(${grayValue}, ${grayValue}, ${grayValue})`,
                color: textColor,
                fontSize: '5px',
                fontFamily: 'monospace',
                fontWeight: 600,
                lineHeight: 1,
              };

              // If this is the DOMINANT contributing cell, highlight prominently
              if (isDominant) {
                cellStyle = {
                  ...cellStyle,
                  backgroundColor: '#FFEB3B', // Bright yellow
                  color: '#000000',
                  border: '2px solid #E65100', // Orange border
                  fontWeight: 800,
                };
              } else if (isHighlighted) {
                // Part of 3x3 window - show with yellow tint overlay
                cellStyle = {
                  ...cellStyle,
                  backgroundColor: `rgba(255, 235, 59, 0.7)`, // Yellow overlay
                  color: '#000000',
                  border: '1px solid #FFC107',
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
      <div className="flex items-center justify-center gap-4 text-xs mt-2">
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
      </div>
    </div>
  );
}
