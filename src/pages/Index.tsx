import { Header } from '@/components/Header';
import { useState } from 'react';
import { ControlPanel } from '@/components/ControlPanel';
import { InputImageGrid } from '@/components/InputImageGrid';
import { ConvolutionVisualization } from '@/components/ConvolutionVisualization';
import { FeatureMapDisplay } from '@/components/FeatureMapDisplay';
import { ActivationVisualization } from '@/components/ActivationVisualization';
import { PoolingVisualization } from '@/components/PoolingVisualization';
import { ExplanationPanel } from '@/components/ExplanationPanel';
import { useCNNVisualization, PoolingType } from '@/hooks/useCNNVisualization';
import { mnistClassLabels, fashionMnistClassLabels } from '@/data/datasets';

const Index = () => {
  const {
    dataset,
    setDataset,
    selectedClass,
    filterType,
    inputImage,
    filter,
    featureMap,
    pooledMap,
    convStep,
    poolStep,
    phase,
    isPlaying,
    isComplete,
    currentConvStep,
    currentPoolStep,
    totalConvSteps,
    totalPoolSteps,
    convOutputSize,
    poolOutputSize,
    setSelectedClass,
    setFilterType,
    step,
    togglePlay,
    reset,
    // NEW: Padding and Stride
    padding,
    setPadding,
    stride,
    setStride,
    paddedInputSize,
    originalInputSize,
    // NEW: Pooling type
    poolingType,
    setPoolingType,
    // NEW: Activation function
    activationType,
    setActivationType,
    activatedFeatureMap,
    displayedActivationMap,
    activationStep,
    totalActivationSteps,
    // NEW: Dedicated activation controls
    isActivationPlaying,
    isActivationComplete,
    stepActivation,
    toggleActivationPlay,
    resetActivation,
    // NEW: Pooling source
    poolingSource,
    setPoolingSource,
    poolingInputMap,
    // NEW: Dedicated pooling controls
    isPoolingPlaying,
    isPoolingComplete,
    stepPooling,
    togglePoolingPlay,
    resetPooling,
    // NEW: Phase control functions
    startActivation,
    startPooling,
    // NEW: Status indicators
    convolutionStatus,
    activationStatus,
    poolingStatus,
    isConvolutionComplete,
  } = useCNNVisualization();

  // --- INTERACTIVE FEATURE: Highlight input region on feature map hover ---
  const [highlightInputRegion, setHighlightInputRegion] = useState<null | {row: number, col: number}>(null);

  // --- ACTIVATION HOVER: Highlight corresponding feature map cell ---
  const [activationHighlight, setActivationHighlight] = useState<null | {row: number, col: number}>(null);

  // --- ADVANCED CONVOLUTION INTERACTION: Track the dominant contributing pixel ---
  const [convolutionHighlight, setConvolutionHighlight] = useState<null | {
    featureMapRow: number;
    featureMapCol: number;
    inputWindow: { row: number; col: number }; // top-left of 3x3 window
    dominantCellPosition: { row: number; col: number }; // exact cell with max contribution
  }>(null);

  // --- SELECTED CONVOLUTION STEP: Full step data for clicked feature map cell ---
  const [selectedConvStep, setSelectedConvStep] = useState<{
    row: number;
    col: number;
    inputWindow: number[][];
    multiplications: number[][];
    sum: number;
  } | null>(null);

  // Handler for when user hovers on a feature map cell - find dominant contributing input pixel
  const handleFeatureMapCellHover = (fmRow: number, fmCol: number) => {
    setHighlightInputRegion({ row: fmRow, col: fmCol });

    // Calculate starting position in the input using stride
    const inputRowStart = fmRow * stride;
    const inputColStart = fmCol * stride;

    // Extract 3x3 input window
    const inputWindow: number[][] = [];
    const multiplications: number[][] = [];
    let sum = 0;
    let maxContribution = -Infinity;
    let dominantRow = inputRowStart;
    let dominantCol = inputColStart;

    for (let i = 0; i < 3; i++) {
      const inputRow: number[] = [];
      const multRow: number[] = [];
      for (let j = 0; j < 3; j++) {
        const pixelRow = inputRowStart + i;
        const pixelCol = inputColStart + j;
        const pixelVal = inputImage[pixelRow]?.[pixelCol] ?? 0;
        const filterVal = filter[i][j];
        const mult = pixelVal * filterVal;
        
        inputRow.push(pixelVal);
        multRow.push(mult);
        sum += mult;

        // Track dominant contribution
        if (Math.abs(mult) > Math.abs(maxContribution)) {
          maxContribution = mult;
          dominantRow = pixelRow;
          dominantCol = pixelCol;
        }
      }
      inputWindow.push(inputRow);
      multiplications.push(multRow);
    }

    // Set the selected convolution step with full calculation
    setSelectedConvStep({
      row: fmRow,
      col: fmCol,
      inputWindow,
      multiplications,
      sum: Math.round(sum),
    });

    setConvolutionHighlight({
      featureMapRow: fmRow,
      featureMapCol: fmCol,
      inputWindow: { row: inputRowStart, col: inputColStart },
      dominantCellPosition: { row: dominantRow, col: dominantCol },
    });
  };

  // Clear convolution highlight
  const clearConvolutionHighlight = () => {
    setHighlightInputRegion(null);
    setConvolutionHighlight(null);
    setSelectedConvStep(null);
  };

  // --- ADVANCED POOLING INTERACTION: Track selected pooled cell and its source ---
  const [poolingHighlight, setPoolingHighlight] = useState<null | {
    pooledRow: number;
    pooledCol: number;
    featureMapWindow: { row: number; col: number }; // top-left of 2x2 window
    maxCellPosition: { row: number; col: number }; // exact cell with max value
    minCellPosition?: { row: number; col: number }; // exact cell with min value
  }>(null);

  // --- SELECTED POOLING STEP: Full step data for clicked pooled cell ---
  const [selectedPoolStep, setSelectedPoolStep] = useState<{
    row: number;
    col: number;
    window: number[][];
    maxValue: number;
    minValue?: number;
    avgValue?: number;
    resultValue: number;
    poolingType: PoolingType;
    maxCellPosition?: { i: number; j: number };
    minCellPosition?: { i: number; j: number };
  } | null>(null);

  // Handler for when user clicks/hovers on a pooled cell
  const handlePooledCellSelect = (pooledRow: number, pooledCol: number) => {
    // For global average pooling, don't allow cell selection (there's only one cell)
    if (poolingType === 'globalAverage') {
      return;
    }

    // Calculate the corresponding 2x2 window in the feature map (or activated map based on poolingSource)
    const convRowStart = pooledRow * 2; // stride = 2
    const convColStart = pooledCol * 2;

    // Use the pooling input map (raw or activated based on poolingSource)
    const sourceMap = poolingInputMap.length > 0 
      ? poolingInputMap 
      : displayFeatureMap;

    // Extract 2x2 window and find max/min
    const window: number[][] = [];
    let maxVal = -Infinity;
    let minVal = Infinity;
    let sum = 0;
    let maxRow = convRowStart;
    let maxCol = convColStart;
    let minRow = convRowStart;
    let minCol = convColStart;
    let maxCellPosition = { i: 0, j: 0 };
    let minCellPosition = { i: 0, j: 0 };

    for (let i = 0; i < 2; i++) {
      const windowRow: number[] = [];
      for (let j = 0; j < 2; j++) {
        const r = convRowStart + i;
        const c = convColStart + j;
        const val = sourceMap[r]?.[c] ?? 0;
        windowRow.push(val);
        sum += val;
        
        if (val > maxVal) {
          maxVal = val;
          maxRow = r;
          maxCol = c;
          maxCellPosition = { i, j };
        }
        if (val < minVal) {
          minVal = val;
          minRow = r;
          minCol = c;
          minCellPosition = { i, j };
        }
      }
      window.push(windowRow);
    }

    const avgVal = sum / 4;
    
    // Determine result value based on current pooling type
    let resultValue: number;
    switch (poolingType) {
      case 'max':
        resultValue = maxVal;
        break;
      case 'min':
        resultValue = minVal;
        break;
      case 'average':
        resultValue = avgVal;
        break;
      default:
        resultValue = maxVal;
    }

    // Set the selected pooling step with full window data
    setSelectedPoolStep({
      row: pooledRow,
      col: pooledCol,
      window,
      maxValue: maxVal,
      minValue: minVal,
      avgValue: avgVal,
      resultValue,
      poolingType,
      maxCellPosition,
      minCellPosition,
    });

    setPoolingHighlight({
      pooledRow,
      pooledCol,
      featureMapWindow: { row: convRowStart, col: convColStart },
      maxCellPosition: poolingType === 'max' ? { row: maxRow, col: maxCol } : 
                       poolingType === 'min' ? { row: minRow, col: minCol } :
                       { row: convRowStart, col: convColStart }, // For average, highlight whole window
      minCellPosition: { row: minRow, col: minCol },
    });
  };

  // Clear pooling highlight
  const clearPoolingHighlight = () => {
    setPoolingHighlight(null);
    setSelectedPoolStep(null);
  };

  const currentClassName = dataset === 'mnist' ? mnistClassLabels[selectedClass] : fashionMnistClassLabels[selectedClass];

  // Initialize empty maps for display
  const displayFeatureMap = featureMap.length > 0 
    ? featureMap 
    : Array(convOutputSize).fill(null).map(() => Array(convOutputSize).fill(null));
  
  const displayPooledMap = pooledMap.length > 0 
    ? pooledMap 
    : Array(poolOutputSize).fill(null).map(() => Array(poolOutputSize).fill(null));

  // Display pooling input map (either raw or activated based on poolingSource)
  const displayPoolingInputMap = poolingInputMap.length > 0 
    ? poolingInputMap 
    : Array(convOutputSize).fill(null).map(() => Array(convOutputSize).fill(null));

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="max-w-6xl mx-auto px-3 py-3 space-y-3">
        {/* Current Selection Info */}
        <div className="bg-card rounded-lg border border-border shadow-sm p-2 text-center">
          <p className="text-sm text-muted-foreground">
            Currently visualizing: <span className="font-semibold text-foreground">{dataset === 'mnist' ? 'MNIST' : 'Fashion-MNIST'}</span> → 
            <span className="font-semibold text-primary ml-1">{selectedClass} - {currentClassName}</span>
          </p>
        </div>

        {/* Control Panel */}
        <ControlPanel
          dataset={dataset}
          setDataset={setDataset}
          selectedClass={selectedClass}
          filterType={filterType}
          isPlaying={isPlaying}
          isComplete={isComplete}
          onClassChange={setSelectedClass}
          onFilterChange={setFilterType}
          onStep={step}
          onTogglePlay={togglePlay}
          onReset={reset}
          padding={padding}
          onPaddingChange={setPadding}
          stride={stride}
          onStrideChange={setStride}
        />

        {/* Convolution Operation */}
        <ConvolutionVisualization
          filter={filter}
          currentStep={selectedConvStep || currentConvStep}
          convStep={selectedConvStep ? (selectedConvStep.row * convOutputSize + selectedConvStep.col + 1) : convStep}
          totalSteps={totalConvSteps}
          phase={phase}
          isInteractive={!!selectedConvStep}
        />

        {/* Main Visualization Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {/* Input Image */}
          <InputImageGrid
            image={inputImage}
            currentStep={currentConvStep}
            phase={phase}
            highlightRegion={highlightInputRegion}
            convolutionHighlight={convolutionHighlight}
            padding={padding}
            stride={stride}
            paddedInputSize={paddedInputSize}
            originalInputSize={originalInputSize}
          />

          {/* Feature Map */}
          <FeatureMapDisplay
            featureMap={displayFeatureMap}
            size={convOutputSize}
            onCellHover={handleFeatureMapCellHover}
            onCellLeave={clearConvolutionHighlight}
            poolingHighlight={poolingHighlight}
            activationHighlight={activationHighlight}
          />
        </div>

        {/* Activation Function - Between Feature Map and Pooling */}
        <ActivationVisualization
          featureMap={displayFeatureMap}
          activatedMap={displayedActivationMap.length > 0 
            ? displayedActivationMap 
            : Array(convOutputSize).fill(null).map(() => Array(convOutputSize).fill(null))}
          size={convOutputSize}
          activationType={activationType}
          onActivationTypeChange={setActivationType}
          poolingSource={poolingSource}
          onPoolingSourceChange={setPoolingSource}
          phase={phase}
          onStep={stepActivation}
          onTogglePlay={toggleActivationPlay}
          onReset={resetActivation}
          isPlaying={isActivationPlaying}
          isActivationComplete={isActivationComplete}
          activationStep={activationStep}
          totalActivationSteps={totalActivationSteps}
          status={activationStatus}
          isConvolutionComplete={isConvolutionComplete}
          onStartActivation={startActivation}
          onActivatedCellHover={(row, col) => {
            setActivationHighlight({ row, col });
            // Also highlight the corresponding input region
            handleFeatureMapCellHover(row, col);
          }}
          onActivatedCellLeave={() => {
            setActivationHighlight(null);
            clearConvolutionHighlight();
          }}
          stride={stride}
        />

        {/* Pooling Operation */}
        <PoolingVisualization
          currentStep={selectedPoolStep || currentPoolStep}
          pooledMap={displayPooledMap}
          poolStep={selectedPoolStep ? (selectedPoolStep.row * poolOutputSize + selectedPoolStep.col + 1) : poolStep}
          totalSteps={totalPoolSteps}
          size={poolOutputSize}
          phase={phase}
          poolingType={poolingType}
          onPoolingTypeChange={setPoolingType}
          onStep={stepPooling}
          onTogglePlay={togglePoolingPlay}
          onReset={resetPooling}
          isPlaying={isPoolingPlaying}
          isPoolingComplete={isPoolingComplete}
          onPooledCellHover={handlePooledCellSelect}
          onPooledCellLeave={clearPoolingHighlight}
          selectedPooledCell={poolingHighlight ? { row: poolingHighlight.pooledRow, col: poolingHighlight.pooledCol } : null}
          isInteractive={!!selectedPoolStep}
          status={poolingStatus}
          isConvolutionComplete={isConvolutionComplete}
          onStartPooling={startPooling}
        />

        {/* Explanation Panel */}
        <ExplanationPanel
          phase={phase}
          convStep={convStep}
          poolStep={poolStep}
          isComplete={isComplete}
          padding={padding}
          stride={stride}
          convOutputSize={convOutputSize}
          poolOutputSize={poolOutputSize}
        />

        {/* Footer */}
        <footer className="text-center py-4 border-t border-border space-y-2">
          <p className="text-sm text-muted-foreground">
            Educational CNN Feature Extraction Visualizer — Developed by{' '}
            <a
              href="https://www.linkedin.com/in/prathvirajchavan/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary font-semibold hover:underline cursor-pointer"
            >
              Prathviraj Chavan
            </a>
            {' '}for academic demonstration.
          </p>
          <div className="flex items-center justify-center gap-1">
            <a
              href="https://www.linkedin.com/in/prathvirajchavan/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-muted-foreground hover:text-primary transition-colors cursor-pointer"
              title="Open LinkedIn Profile"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
              </svg>
              <span className="text-sm hover:underline">Prathviraj Chavan</span>
            </a>
          </div>
        </footer>
      </main>
    </div>
  );
};

export default Index;
