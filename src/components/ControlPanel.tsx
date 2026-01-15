import { Button } from '@/components/ui/button';
import { Play, Pause, RotateCcw, StepForward } from 'lucide-react';
import { FilterType, mnistClassLabels, fashionMnistClassLabels, DatasetType } from '@/data/datasets';

interface ControlPanelProps {
  dataset: DatasetType;
  setDataset: (dataset: DatasetType) => void;
  selectedClass: number;
  filterType: FilterType;
  isPlaying: boolean;
  isComplete: boolean;
  onClassChange: (classIndex: number) => void;
  onFilterChange: (filter: FilterType) => void;
  onStep: () => void;
  onTogglePlay: () => void;
  onReset: () => void;
  // NEW: Padding and Stride props
  padding: number;
  onPaddingChange: (padding: number) => void;
  stride: number;
  onStrideChange: (stride: number) => void;
}
export function ControlPanel({
  dataset,
  setDataset,
  selectedClass,
  filterType,
  isPlaying,
  isComplete,
  onClassChange,
  onFilterChange,
  onStep,
  onTogglePlay,
  onReset,
  padding,
  onPaddingChange,
  stride,
  onStrideChange,
}: ControlPanelProps) {
  const filters: { value: FilterType; label: string }[] = [
    { value: 'topEdge', label: 'Top Edge' },
    { value: 'bottomEdge', label: 'Bottom Edge' },
    { value: 'leftEdge', label: 'Left Edge' },
    { value: 'rightEdge', label: 'Right Edge' },
  ];

  return (
    <div className="bg-card rounded-lg border border-border shadow-sm p-3">
      <h2 className="text-sm font-semibold text-foreground mb-2">Controls</h2>
      <div className="grid grid-cols-1 lg:grid-cols-6 gap-3">
        {/* Dataset Selector - Disabled, only MNIST supported */}
        <div className="hidden">
          <label className="block text-sm font-medium text-muted-foreground mb-2">
            Dataset
          </label>
          <select
            value={dataset}
            onChange={e => setDataset(e.target.value as DatasetType)}
            className="w-full px-3 py-2 rounded-lg bg-primary text-primary-foreground border border-border focus:outline-none focus:ring-2 focus:ring-primary text-sm font-medium shadow-md"
          >
            <option value="mnist">MNIST</option>
            <option value="fashion">Fashion-MNIST</option>
          </select>
        </div>

        {/* Class Selector */}
        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-2">
            Digit Class
          </label>
          <select
            value={selectedClass}
            onChange={(e) => onClassChange(Number(e.target.value))}
            className="w-full px-3 py-2 rounded-lg bg-secondary text-secondary-foreground border border-border focus:outline-none focus:ring-2 focus:ring-primary text-sm"
          >
            {(dataset === 'mnist' ? Object.entries(mnistClassLabels) : Object.entries(fashionMnistClassLabels)).map(([index, label]) => (
              <option key={index} value={index}>
                {index} - {label}
              </option>
            ))}
          </select>
        </div>

        {/* Padding Selector */}
        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-2">
            Padding
          </label>
          <select
            value={padding}
            onChange={(e) => onPaddingChange(Number(e.target.value))}
            className="w-full px-3 py-2 rounded-lg bg-secondary text-secondary-foreground border border-border focus:outline-none focus:ring-2 focus:ring-primary text-sm"
          >
            <option value={0}>0 (No Padding)</option>
            <option value={1}>1 (Zero Padding)</option>
            <option value={2}>2 (Zero Padding)</option>
          </select>
        </div>

        {/* Stride Selector */}
        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-2">
            Stride
          </label>
          <select
            value={stride}
            onChange={(e) => onStrideChange(Number(e.target.value))}
            className="w-full px-3 py-2 rounded-lg bg-secondary text-secondary-foreground border border-border focus:outline-none focus:ring-2 focus:ring-primary text-sm"
          >
            <option value={1}>1</option>
            <option value={2}>2</option>
          </select>
        </div>

        {/* Filter Selector */}
        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-2">
            Edge Filter
          </label>
          <select
            value={filterType}
            onChange={(e) => onFilterChange(e.target.value as FilterType)}
            className="w-full px-3 py-2 rounded-lg bg-secondary text-secondary-foreground border border-border focus:outline-none focus:ring-2 focus:ring-primary text-sm"
          >
            {filters.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>
        </div>

        {/* Action Buttons */}
        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-2">
            Animation
          </label>
          <div className="flex gap-2">
            <Button
              onClick={onStep}
              disabled={isPlaying || isComplete}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <StepForward className="w-4 h-4" />
              Step
            </Button>
            <Button
              onClick={onTogglePlay}
              disabled={isComplete}
              variant="default"
              size="sm"
              className="flex items-center gap-2"
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
              onClick={onReset}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Reset
            </Button>
          </div>
        </div>
      </div>

      {/* Padding & Stride Explanations */}
      <div className="mt-3 pt-3 border-t border-border grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="flex items-start gap-2 p-2 bg-secondary/50 rounded-lg">
          <div className="shrink-0 w-5 h-5 rounded bg-primary/20 text-primary flex items-center justify-center text-xs font-bold">P</div>
          <div>
            <span className="text-xs font-semibold text-foreground">Padding = {padding}</span>
            <p className="text-xs text-muted-foreground mt-0.5">
              {padding === 0 
                ? "No padding applied (Valid Convolution). Output will be smaller than input."
                : `${padding} layer${padding > 1 ? 's' : ''} of zero-valued pixels added around the input image. Input expands from 28×28 to ${28 + 2 * padding}×${28 + 2 * padding}.`
              }
            </p>
          </div>
        </div>
        <div className="flex items-start gap-2 p-2 bg-secondary/50 rounded-lg">
          <div className="shrink-0 w-5 h-5 rounded bg-accent/20 text-accent flex items-center justify-center text-xs font-bold">S</div>
          <div>
            <span className="text-xs font-semibold text-foreground">Stride = {stride}</span>
            <p className="text-xs text-muted-foreground mt-0.5">
              {stride === 1 
                ? "Filter moves 1 pixel at a time. Produces more feature map cells with finer spatial resolution."
                : "Filter moves 2 pixels at a time. Produces fewer feature map cells, effectively downsampling the output."
              }
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ControlPanel;
