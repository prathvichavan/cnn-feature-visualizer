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
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-3">
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

        {/* Filter Selector */}
        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-2">
            Edge Filter
          </label>
          <div className="flex flex-wrap gap-2">
            {filters.map((f) => (
              <button
                key={f.value}
                onClick={() => onFilterChange(f.value)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  filterType === f.value
                    ? 'bg-accent text-accent-foreground shadow-md'
                    : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
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
    </div>
  );
}

export default ControlPanel;
