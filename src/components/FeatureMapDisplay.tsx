import { useMemo, useState } from 'react';

// Type for pooling highlight from parent
interface PoolingHighlight {
  pooledRow: number;
  pooledCol: number;
  featureMapWindow: { row: number; col: number }; // top-left of 2x2 window
  maxCellPosition: { row: number; col: number }; // exact cell with max value
}

interface FeatureMapDisplayProps {
  featureMap: number[][];
  size: number;
  onCellHover?: (row: number, col: number) => void;
  onCellLeave?: () => void;
  poolingHighlight?: PoolingHighlight | null; // Highlight from pooling interaction
  activationHighlight?: { row: number; col: number } | null; // Highlight from activation hover
}

export function FeatureMapDisplay({ featureMap, size, onCellHover, onCellLeave, poolingHighlight, activationHighlight }: FeatureMapDisplayProps) {
  const [hoveredCell, setHoveredCell] = useState<{ row: number; col: number } | null>(null);
  
  const { minVal, maxVal } = useMemo(() => {
    let min = 0;
    let max = 0;
    featureMap.forEach(row => {
      row.forEach(val => {
        if (val !== null) {
          min = Math.min(min, val);
          max = Math.max(max, val);
        }
      });
    });
    return { minVal: min, maxVal: max };
  }, [featureMap]);

  const getColor = (val: number | null): { bg: string; text: string } => {
    if (val === null) return { bg: 'hsl(var(--muted))', text: 'hsl(var(--muted-foreground))' };
    
    // Zero values: neutral background, show "0"
    if (val === 0) {
      return { bg: 'hsl(0, 0%, 95%)', text: '#000000' };
    }
    
    const absMax = Math.max(Math.abs(minVal), Math.abs(maxVal)) || 1;
    const normalized = val / absMax;
    
    if (normalized > 0) {
      // Positive - red shades
      const intensity = Math.min(1, normalized);
      const lightness = 95 - (intensity * 45);
      const textColor = lightness > 60 ? '#000000' : '#ffffff';
      return { bg: `hsl(0, 84%, ${lightness}%)`, text: textColor };
    } else {
      // Negative - blue shades
      const intensity = Math.min(1, -normalized);
      const lightness = 95 - (intensity * 45);
      const textColor = lightness > 60 ? '#000000' : '#ffffff';
      return { bg: `hsl(217, 91%, ${lightness}%)`, text: textColor };
    }
  };

  const formatValue = (val: number | null): string => {
    if (val === null) return '';
    if (val === 0) return '0';
    const rounded = Math.round(val);
    if (Math.abs(rounded) >= 1000) {
      return Math.round(rounded / 100) / 10 + 'k';
    }
    if (Math.abs(rounded) >= 100) {
      return rounded.toString();
    }
    return rounded.toString();
  };

  const completedCells = featureMap.flat().filter(v => v !== null).length;
  const totalCells = size * size;

  // Check if a cell is part of the pooling 2x2 window
  const isInPoolingWindow = (row: number, col: number): boolean => {
    if (!poolingHighlight) return false;
    const { featureMapWindow } = poolingHighlight;
    return (
      row >= featureMapWindow.row &&
      row < featureMapWindow.row + 2 &&
      col >= featureMapWindow.col &&
      col < featureMapWindow.col + 2
    );
  };

  // Check if a cell is the MAX cell (the one selected by pooling)
  const isMaxCell = (row: number, col: number): boolean => {
    if (!poolingHighlight) return false;
    const { maxCellPosition } = poolingHighlight;
    return row === maxCellPosition.row && col === maxCellPosition.col;
  };

  // Check if a cell is highlighted from activation hover
  const isActivationHighlighted = (row: number, col: number): boolean => {
    if (!activationHighlight) return false;
    return row === activationHighlight.row && col === activationHighlight.col;
  };

  return (
    <div className="bg-card rounded-lg border border-border shadow-sm p-2">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-foreground">Feature Map ({size}×{size})</h3>
        <span className="text-xs text-muted-foreground">
          {completedCells}/{totalCells}
        </span>
      </div>
      
      <p className="text-xs text-muted-foreground mb-2">
        Red = positive, Blue = negative.
      </p>
      
      <div className="flex justify-center mb-2 overflow-auto">
        <div 
          className="inline-grid bg-border"
          style={{ 
            gridTemplateColumns: `repeat(${size}, 18px)`,
            gap: '1px',
            padding: '1px',
          }}
        >
          {featureMap.map((row, rowIdx) =>
            row.map((val, colIdx) => {
              const colors = getColor(val);
              const inPoolWindow = isInPoolingWindow(rowIdx, colIdx);
              const isMax = isMaxCell(rowIdx, colIdx);
              const isActivationHovered = isActivationHighlighted(rowIdx, colIdx);
              
              // Determine cell styling based on highlights
              let cellStyle: React.CSSProperties = {
                width: '18px',
                height: '18px',
                backgroundColor: colors.bg,
                color: colors.text,
                fontSize: '7px',
                fontFamily: 'monospace',
                fontWeight: 600,
              };
              
              // If this cell is highlighted from activation hover
              if (isActivationHovered) {
                cellStyle = {
                  ...cellStyle,
                  backgroundColor: '#FF9800', // Orange highlight
                  color: '#000000',
                  border: '2px solid #E65100', // Dark orange border
                  fontWeight: 800,
                };
              }
              // If this is the MAX cell, highlight with yellow background and bold border
              else if (isMax) {
                cellStyle = {
                  ...cellStyle,
                  backgroundColor: '#FFEB3B', // Bright yellow
                  color: '#000000',
                  border: '2px solid #F57F17', // Dark yellow/orange border
                  fontWeight: 800,
                };
              } else if (inPoolWindow) {
                // Part of 2x2 window but not max - show subtle highlight
                cellStyle = {
                  ...cellStyle,
                  border: '1px dashed #FFC107',
                  opacity: 0.8,
                };
              }
              
              return (
                <div
                  key={`${rowIdx}-${colIdx}`}
                  className={`flex items-center justify-center transition-all cursor-pointer ${
                    hoveredCell?.row === rowIdx && hoveredCell?.col === colIdx
                      ? 'ring-2 ring-blue-400 z-10'
                      : ''
                  } ${isMax ? 'z-20 scale-110' : ''} ${isActivationHovered ? 'z-20 scale-110' : ''}`}
                  style={cellStyle}
                  onMouseEnter={() => {
                    setHoveredCell({ row: rowIdx, col: colIdx });
                    if (typeof onCellHover === 'function') onCellHover(rowIdx, colIdx);
                  }}
                  onMouseLeave={() => {
                    setHoveredCell(null);
                    if (typeof onCellLeave === 'function') onCellLeave();
                  }}
                  title={val !== null ? `(${rowIdx}, ${colIdx}): ${val}${isActivationHovered ? ' ← Activation source' : ''}` : 'Not computed'}
                >
                  {formatValue(val)}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Hovered Cell Detail */}
      {hoveredCell && featureMap[hoveredCell.row]?.[hoveredCell.col] !== null && (
        <div className="text-center mb-2 p-1 bg-secondary rounded">
          <span className="text-xs text-muted-foreground">
            ({hoveredCell.row},{hoveredCell.col}): 
            <span className="font-mono font-bold text-foreground ml-1">
              {featureMap[hoveredCell.row][hoveredCell.col]}
            </span>
          </span>
        </div>
      )}

      {/* Color Legend */}
      <div className="flex items-center justify-center gap-3 text-xs">
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
