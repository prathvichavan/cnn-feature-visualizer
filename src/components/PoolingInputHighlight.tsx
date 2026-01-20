import React from 'react';

interface PoolingInputHighlightProps {
  featureMap: (number | null)[][];
  poolStep: number;
  poolSize: number;
  stride: number;
  poolOutputSize: number;
  highlightWindow?: { row: number; col: number } | null;
  isGlobalAverage?: boolean;
}

export const PoolingInputHighlight: React.FC<PoolingInputHighlightProps> = ({
  featureMap,
  poolStep,
  poolSize,
  stride,
  poolOutputSize,
  highlightWindow,
  isGlobalAverage = false,
}) => {
  // Calculate highlight position
  let highlight: { row: number; col: number } | null = null;
  if (highlightWindow) {
    highlight = highlightWindow;
  } else if (!isGlobalAverage && poolStep > 0) {
    const idx = poolStep - 1;
    const row = Math.floor(idx / poolOutputSize);
    const col = idx % poolOutputSize;
    highlight = { row: row * stride, col: col * stride };
  }

  return (
    <div className="inline-block">
      <div className="grid" style={{ gridTemplateColumns: `repeat(${featureMap.length}, 1.5rem)` }}>
        {featureMap.map((rowVals, rowIdx) =>
          rowVals.map((val, colIdx) => {
            let highlightCell = false;
            if (isGlobalAverage) {
              highlightCell = true;
            } else if (highlight) {
              highlightCell =
                rowIdx >= highlight.row &&
                rowIdx < highlight.row + poolSize &&
                colIdx >= highlight.col &&
                colIdx < highlight.col + poolSize;
            }
            return (
              <div
                key={`${rowIdx}-${colIdx}`}
                className={`w-6 h-6 flex items-center justify-center border text-xs font-mono ${
                  highlightCell ? (isGlobalAverage ? 'border-blue-400 bg-blue-50' : 'border-orange-500 bg-orange-50') : 'border-slate-200'
                }`}
                style={{ transition: 'background 0.2s, border 0.2s' }}
              >
                {val === null ? '' : val}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
