import { Info, Layers, Grid3X3, Minimize2 } from 'lucide-react';

interface ExplanationPanelProps {
  phase: 'convolution' | 'pooling';
  convStep: number;
  poolStep: number;
  isComplete: boolean;
  // NEW: Padding and Stride props
  padding: number;
  stride: number;
  convOutputSize: number;
  poolOutputSize: number;
}

export function ExplanationPanel({ 
  phase, 
  convStep, 
  poolStep, 
  isComplete,
  padding,
  stride,
  convOutputSize,
  poolOutputSize
}: ExplanationPanelProps) {
  // Total steps based on dynamic sizes
  const totalConvSteps = convOutputSize * convOutputSize;
  const totalPoolSteps = poolOutputSize * poolOutputSize;

  const getExplanation = () => {
    if (isComplete) {
      return {
        icon: <Info className="w-5 h-5 text-accent" />,
        title: 'Feature Extraction Complete!',
        description: `The CNN has extracted features from the input image through convolution (edge detection) and reduced the spatial dimensions through max pooling. ${padding > 0 ? `With padding=${padding}, the input was expanded before convolution. ` : ''}${stride > 1 ? `With stride=${stride}, the filter moved faster, producing a smaller feature map. ` : ''}These features would then be fed to fully connected layers for classification.`,
        step: 'Done',
      };
    }
    
    if (phase === 'convolution') {
      if (convStep === 0) {
        return {
          icon: <Layers className="w-5 h-5 text-primary" />,
          title: 'Ready to Start',
          description: `Click "Step" or "Play" to begin the convolution operation. The 3×3 filter will slide across the ${padding > 0 ? 'padded ' : ''}input image${stride > 1 ? ` with stride ${stride}` : ''}, detecting edges based on the selected filter type.`,
          step: 'Waiting',
        };
      }
      const currentRow = Math.floor((convStep - 1) / convOutputSize);
      const currentCol = (convStep - 1) % convOutputSize;
      return {
        icon: <Grid3X3 className="w-5 h-5 text-primary" />,
        title: 'Convolution in Progress',
        description: `The 3×3 filter slides across the image${stride > 1 ? ` with stride ${stride}` : ''}, performing element-wise multiplication and summing the results. Output size: ${convOutputSize}×${convOutputSize}. Currently at position (${currentRow}, ${currentCol}).`,
        step: 'Convolving',
      };
    }
    
    const currentPoolRow = Math.floor((poolStep - 1) / poolOutputSize);
    const currentPoolCol = (poolStep - 1) % poolOutputSize;
    return {
      icon: <Minimize2 className="w-5 h-5 text-accent" />,
      title: 'Max Pooling in Progress',
      description: `A 2×2 window slides across the feature map with stride 2, selecting the maximum value in each window. This reduces spatial dimensions from ${convOutputSize}×${convOutputSize} to ${poolOutputSize}×${poolOutputSize}. Currently at position (${currentPoolRow}, ${currentPoolCol}).`,
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
              <span>Conv ({convOutputSize}×{convOutputSize})</span>
              <span>{Math.min(convStep, totalConvSteps)}/{totalConvSteps}</span>
            </div>
            <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary transition-all duration-150 ease-out"
                style={{ width: `${(Math.min(convStep, totalConvSteps) / totalConvSteps) * 100}%` }}
              />
            </div>
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-0.5">
              <span>Pool ({poolOutputSize}×{poolOutputSize})</span>
              <span>{Math.min(poolStep, totalPoolSteps)}/{totalPoolSteps}</span>
            </div>
            <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
              <div 
                className="h-full bg-accent transition-all duration-150 ease-out"
                style={{ width: `${(Math.min(poolStep, totalPoolSteps) / totalPoolSteps) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Padding & Stride Info */}
      {(padding > 0 || stride > 1) && (
        <div className="mt-2 pt-2 border-t border-border">
          <div className="flex flex-wrap gap-2 text-xs">
            {padding > 0 && (
              <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full">
                Padding: {padding}
              </span>
            )}
            {stride > 1 && (
              <span className="px-2 py-0.5 bg-green-100 text-green-800 rounded-full">
                Stride: {stride}
              </span>
            )}
            <span className="px-2 py-0.5 bg-gray-100 text-gray-800 rounded-full">
              Output: {convOutputSize}×{convOutputSize} → {poolOutputSize}×{poolOutputSize}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
