import { Info, Layers, Grid3X3, Minimize2 } from 'lucide-react';

interface ExplanationPanelProps {
  phase: 'convolution' | 'pooling';
  convStep: number;
  poolStep: number;
  isComplete: boolean;
}

export function ExplanationPanel({ phase, convStep, poolStep, isComplete }: ExplanationPanelProps) {
  const getExplanation = () => {
    if (isComplete) {
      return {
        icon: <Info className="w-5 h-5 text-accent" />,
        title: 'Feature Extraction Complete!',
        description: 'The CNN has extracted features from the input image through convolution (edge detection) and reduced the spatial dimensions through max pooling. These features would then be fed to fully connected layers for classification.',
        step: 'Done',
      };
    }
    
    if (phase === 'convolution') {
      if (convStep === 0) {
        return {
          icon: <Layers className="w-5 h-5 text-primary" />,
          title: 'Ready to Start',
          description: 'Click "Step" or "Play" to begin the convolution operation. The filter will slide across the input image, detecting edges based on the selected filter type.',
          step: 'Waiting',
        };
      }
      return {
        icon: <Grid3X3 className="w-5 h-5 text-primary" />,
        title: 'Convolution in Progress',
        description: `The 3×3 filter slides across the image, performing element-wise multiplication and summing the results. This creates a feature map that highlights edges. Currently at position (${Math.floor((convStep - 1) / 26)}, ${(convStep - 1) % 26}).`,
        step: 'Convolving',
      };
    }
    
    return {
      icon: <Minimize2 className="w-5 h-5 text-accent" />,
      title: 'Max Pooling in Progress',
      description: `A 2×2 window slides across the feature map with stride 2, selecting the maximum value in each window. This reduces spatial dimensions while preserving the most prominent features. Currently at position (${Math.floor((poolStep - 1) / 13)}, ${(poolStep - 1) % 13}).`,
      step: 'Pooling',
    };
  };

  const { icon, title, description, step } = getExplanation();

  return (
    <div className="bg-card rounded-lg border border-border shadow-sm p-2">
      <div className="flex items-start gap-2">
        <div className="p-1 bg-secondary rounded shrink-0">
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <h3 className="text-sm font-semibold text-foreground">{title}</h3>
            <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
              isComplete 
                ? 'bg-accent/20 text-accent' 
                : phase === 'convolution'
                  ? 'bg-primary/20 text-primary'
                  : 'bg-accent/20 text-accent'
            }`}>
              {step}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            {description}
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mt-2 pt-2 border-t border-border">
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-0.5">
              <span>Conv</span>
              <span>{Math.min(convStep, 676)}/676</span>
            </div>
            <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary transition-all duration-150 ease-out"
                style={{ width: `${(Math.min(convStep, 676) / 676) * 100}%` }}
              />
            </div>
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-0.5">
              <span>Pool</span>
              <span>{Math.min(poolStep, 169)}/169</span>
            </div>
            <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
              <div 
                className="h-full bg-accent transition-all duration-150 ease-out"
                style={{ width: `${(Math.min(poolStep, 169) / 169) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
