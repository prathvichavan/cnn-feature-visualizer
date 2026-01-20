import { useState } from 'react';
import { FeatureMapDisplay } from '@/components/FeatureMapDisplay';
import { Layout } from '@/components/layout/Layout';
import { ControlPanel } from '@/components/ControlPanel';
import { PoolingVisualization } from '@/components/PoolingVisualization';
import { useCNNVisualization, StageStatus } from '@/hooks/useCNNVisualization';
import { mnistClassLabels, fashionMnistClassLabels } from '@/data/datasets';
import { Link } from 'react-router-dom';
import { ArrowRight, ArrowLeft, Lightbulb, Info, Grid3X3, Minimize2 } from 'lucide-react';
import { PipelinePrerequisite, PipelineProgress } from '@/components/PipelinePrerequisite';
import { isConvolutionComplete as checkConvComplete, isActivationComplete as checkActComplete, isPoolingComplete as checkPoolComplete, isFlattenComplete as checkFlattenComplete, isDenseComplete as checkDenseComplete } from '@/lib/cnnStateStore';

export default function PoolingPage() {
  const {
    dataset,
    setDataset,
    selectedClass,
    filterType,
    featureMap,
    pooledMap,
    phase,
    isPlaying,
    currentPoolStep,
    convOutputSize,
    poolOutputSize,
    totalPoolSteps,
    poolStep,
    setSelectedClass,
    setFilterType,
    step,
    togglePlay,
    reset,
    padding,
    setPadding,
    stride,
    setStride,
    poolingType,
    setPoolingType,
    isPoolingPlaying,
    isPoolingComplete,
    stepPooling,
    togglePoolingPlay,
    resetPooling,
    startPooling,
    poolingStatus,
    isConvolutionComplete,
    poolingInputMap,
    displayedActivationMap,
  } = useCNNVisualization();

  const [poolingHighlight, setPoolingHighlight] = useState<null | {
    pooledRow: number;
    pooledCol: number;
    featureMapWindow: { row: number; col: number };
    maxCellPosition: { row: number; col: number };
    minCellPosition?: { row: number; col: number };
  }>(null);

  const [selectedPoolStep, setSelectedPoolStep] = useState<{
    row: number;
    col: number;
    window: number[][];
    maxValue: number;
    minValue?: number;
    avgValue?: number;
    resultValue: number;
    poolingType: typeof poolingType;
    maxCellPosition?: { i: number; j: number };
    minCellPosition?: { i: number; j: number };
  } | null>(null);

  const handlePooledCellSelect = (pooledRow: number, pooledCol: number) => {
    if (poolingType === 'globalAverage') return;

    const convRowStart = pooledRow * 2;
    const convColStart = pooledCol * 2;
    const sourceMap = poolingInputMap.length > 0 ? poolingInputMap : displayFeatureMap;

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
    let resultValue: number;
    switch (poolingType) {
      case 'max': resultValue = maxVal; break;
      case 'min': resultValue = minVal; break;
      case 'average': resultValue = avgVal; break;
      default: resultValue = maxVal;
    }

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
                       { row: convRowStart, col: convColStart },
      minCellPosition: { row: minRow, col: minCol },
    });
  };

  const clearPoolingHighlight = () => {
    setPoolingHighlight(null);
    setSelectedPoolStep(null);
  };

  const currentClassName = dataset === 'mnist'
    ? mnistClassLabels[selectedClass]
    : fashionMnistClassLabels[selectedClass];

  const displayFeatureMap = featureMap.length > 0
    ? featureMap
    : Array(convOutputSize).fill(null).map(() => Array(convOutputSize).fill(null));

  const displayPooledMap = pooledMap.length > 0
    ? pooledMap
    : Array(poolOutputSize).fill(null).map(() => Array(poolOutputSize).fill(null));

  // Pipeline progress for navigation
  const pipelineStages = [
    { name: 'Convolution', route: '/convolution', isComplete: checkConvComplete(), isCurrent: false },
    { name: 'Activation', route: '/activation', isComplete: checkActComplete(), isCurrent: false },
    { name: 'Pooling', route: '/pooling', isComplete: checkPoolComplete(), isCurrent: true },
    { name: 'Flatten', route: '/flatten', isComplete: checkFlattenComplete(), isCurrent: false },
    { name: 'Dense', route: '/dense', isComplete: checkDenseComplete(), isCurrent: false },
  ];

  // Check prerequisite
  const prerequisite = !isConvolutionComplete 
    ? { stageName: 'Convolution', stageRoute: '/convolution', isComplete: false }
    : null;

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4">
        {/* Pipeline Progress */}
        <PipelineProgress stages={pipelineStages} />
        
        {/* Prerequisite Warning */}
        <PipelinePrerequisite 
          prerequisite={prerequisite}
          currentStageName="Pooling"
        />
        
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-br from-green-400 to-green-600 rounded-xl shadow-lg">
              <Grid3X3 className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-slate-800">
                Pooling Layer
              </h1>
              <p className="text-slate-600">Reduce dimensions while preserving important features</p>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <Link
              to="/activation"
              className="inline-flex items-center gap-2 text-slate-600 hover:text-indigo-600 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back: Activation
            </Link>
            <Link
              to="/flatten"
              className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg font-medium hover:shadow-lg transition-all"
            >
              Next: Flatten
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Educational Explanation */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-200">
            <div className="flex items-center gap-2 mb-3">
              <Info className="w-5 h-5 text-green-600" />
              <h3 className="font-bold text-green-800">What is Pooling?</h3>
            </div>
            <p className="text-sm text-slate-700 leading-relaxed">
              Pooling <strong>reduces the spatial dimensions</strong> of feature maps. A 2×2 pooling 
              window slides over the feature map, selecting one value from each window to create 
              a smaller output.
            </p>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-200">
            <div className="flex items-center gap-2 mb-3">
              <Lightbulb className="w-5 h-5 text-blue-600" />
              <h3 className="font-bold text-blue-800">Why Use Pooling?</h3>
            </div>
            <p className="text-sm text-slate-700 leading-relaxed">
              Pooling provides <strong>translation invariance</strong> (slight shifts don't change output), 
              <strong>reduces parameters</strong> (fewer computations), and helps prevent overfitting by 
              creating a more abstract representation.
            </p>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 border border-purple-200">
            <div className="flex items-center gap-2 mb-3">
              <ArrowRight className="w-5 h-5 text-purple-600" />
              <h3 className="font-bold text-purple-800">What Comes Next?</h3>
            </div>
            <p className="text-sm text-slate-700 leading-relaxed">
              After pooling, we <strong>flatten</strong> the 2D feature map into a 1D vector. 
              This prepares the data for the fully connected (dense) layers that will make 
              the final classification.
            </p>
          </div>
        </div>

        {/* Pooling Types Comparison */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-8">
          <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Minimize2 className="w-5 h-5 text-green-600" />
            Pooling Types Comparison
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-yellow-50 rounded-xl p-4 ring-2 ring-yellow-400">
              <h4 className="font-semibold text-yellow-700 mb-2">Max Pooling ⭐</h4>
              <div className="bg-white rounded-lg p-3 mb-2">
                <div className="grid grid-cols-2 gap-1 text-xs font-mono text-center">
                  <div className="bg-yellow-100 p-2 rounded">10</div>
                  <div className="bg-yellow-400 p-2 rounded font-bold">50</div>
                  <div className="bg-yellow-100 p-2 rounded">30</div>
                  <div className="bg-yellow-100 p-2 rounded">20</div>
                </div>
                <div className="text-center mt-2 text-sm font-bold text-yellow-600">→ 50</div>
              </div>
              <p className="text-xs text-yellow-700">Keeps strongest activation</p>
            </div>

            <div className="bg-blue-50 rounded-xl p-4">
              <h4 className="font-semibold text-blue-700 mb-2">Min Pooling</h4>
              <div className="bg-white rounded-lg p-3 mb-2">
                <div className="grid grid-cols-2 gap-1 text-xs font-mono text-center">
                  <div className="bg-blue-400 p-2 rounded font-bold">10</div>
                  <div className="bg-blue-100 p-2 rounded">50</div>
                  <div className="bg-blue-100 p-2 rounded">30</div>
                  <div className="bg-blue-100 p-2 rounded">20</div>
                </div>
                <div className="text-center mt-2 text-sm font-bold text-blue-600">→ 10</div>
              </div>
              <p className="text-xs text-blue-700">Keeps weakest activation</p>
            </div>

            <div className="bg-green-50 rounded-xl p-4">
              <h4 className="font-semibold text-green-700 mb-2">Average Pooling</h4>
              <div className="bg-white rounded-lg p-3 mb-2">
                <div className="grid grid-cols-2 gap-1 text-xs font-mono text-center">
                  <div className="bg-green-200 p-2 rounded">10</div>
                  <div className="bg-green-200 p-2 rounded">50</div>
                  <div className="bg-green-200 p-2 rounded">30</div>
                  <div className="bg-green-200 p-2 rounded">20</div>
                </div>
                <div className="text-center mt-2 text-sm font-bold text-green-600">→ 27.5</div>
              </div>
              <p className="text-xs text-green-700">Average of all values</p>
            </div>

            <div className="bg-purple-50 rounded-xl p-4">
              <h4 className="font-semibold text-purple-700 mb-2">Global Average</h4>
              <div className="bg-white rounded-lg p-3 mb-2">
                <div className="grid grid-cols-3 gap-0.5 text-[8px] font-mono text-center">
                  {[10, 20, 30, 40, 50, 60, 70, 80, 90].map((v, i) => (
                    <div key={i} className="bg-purple-200 p-1 rounded">{v}</div>
                  ))}
                </div>
                <div className="text-center mt-2 text-sm font-bold text-purple-600">→ 50</div>
              </div>
              <p className="text-xs text-purple-700">One value per channel</p>
            </div>
          </div>
        </div>

        {/* Current Selection Info */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 text-center mb-6">
          <p className="text-sm text-slate-600">
            Currently visualizing:{' '}
            <span className="font-semibold text-slate-800">{dataset === 'mnist' ? 'MNIST' : 'Fashion-MNIST'}</span>
            {' → '}
            <span className="font-semibold text-green-600">{selectedClass} - {currentClassName}</span>
            {!isConvolutionComplete && (
              <span className="text-orange-600 ml-2">(Complete convolution first)</span>
            )}
          </p>
        </div>

        {/* Control Panel */}
        <div className="mb-6">
          <ControlPanel
            dataset={dataset}
            setDataset={setDataset}
            selectedClass={selectedClass}
            filterType={filterType}
            isPlaying={isPlaying}
            isComplete={isConvolutionComplete}
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
        </div>

        {/* Activation Output as Input to Pooling - NEW SECTION */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Left: Activation Output (Input to Pooling) */}
            <div className="lg:w-2/5 w-full">
              <div className="section-frame module bg-card h-full flex flex-col">
                <h3 className="text-base font-bold text-slate-800 mb-2">Input to Pooling Layer (Output of Activation)</h3>
                <p className="text-xs text-muted-foreground mb-2">Red = positive, Blue = negative, Zero = gray</p>
                <FeatureMapDisplay
                  featureMap={displayedActivationMap}
                  size={convOutputSize}
                  poolingHighlight={poolingHighlight}
                  onCellHover={(row, col) => {
                    // When hovering a cell in activation, highlight the pooled cell if in a 2x2 window
                    if (poolingType === 'globalAverage') return;
                    // Find which pooled cell this activation cell maps to
                    const pooledRow = Math.floor(row / 2);
                    const pooledCol = Math.floor(col / 2);
                    if (
                      pooledRow >= 0 && pooledRow < poolOutputSize &&
                      pooledCol >= 0 && pooledCol < poolOutputSize
                    ) {
                      handlePooledCellSelect(pooledRow, pooledCol);
                    }
                  }}
                  onCellLeave={clearPoolingHighlight}
                />
              </div>
            </div>
            {/* Right: Pooling Visualization and controls */}
            <div className="lg:w-3/5 w-full">
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
            </div>
          </div>
        </div>

        {/* Size Reduction Visualization */}
        <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-2xl p-6 text-white mb-8">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <span className="text-2xl">📉</span> Dimension Reduction
          </h3>
          <div className="flex flex-col md:flex-row items-center justify-center gap-6">
            <div className="text-center">
              <div className="bg-white/10 rounded-xl p-4 mb-2">
                <p className="text-3xl font-bold text-green-400">{convOutputSize}×{convOutputSize}</p>
              </div>
              <p className="text-slate-300 text-sm">Feature Map</p>
              <p className="text-slate-400 text-xs">{convOutputSize * convOutputSize} values</p>
            </div>
            <div className="text-4xl">→</div>
            <div className="bg-white/10 rounded-xl p-4">
              <p className="text-sm text-slate-300 mb-2">2×2 Pool, Stride 2</p>
              <div className="grid grid-cols-2 gap-1">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="w-4 h-4 bg-green-500/50 rounded"></div>
                ))}
              </div>
            </div>
            <div className="text-4xl">→</div>
            <div className="text-center">
              <div className="bg-white/10 rounded-xl p-4 mb-2">
                <p className="text-3xl font-bold text-yellow-400">{poolOutputSize}×{poolOutputSize}</p>
              </div>
              <p className="text-slate-300 text-sm">Pooled Output</p>
              <p className="text-slate-400 text-xs">{poolOutputSize * poolOutputSize} values</p>
            </div>
          </div>
          <p className="text-center text-slate-400 text-sm mt-4">
            Pooling reduced the data by <strong className="text-yellow-400">{Math.round((1 - (poolOutputSize * poolOutputSize) / (convOutputSize * convOutputSize)) * 100)}%</strong>
          </p>
        </div>

        {/* Tips */}
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 mb-8">
          <h3 className="font-bold text-amber-800 mb-3 flex items-center gap-2">
            <span className="text-xl">💡</span> Interactive Tips
          </h3>
          <ul className="space-y-2 text-sm text-slate-700">
            <li className="flex items-start gap-2">
              <span className="text-amber-600">•</span>
              <span><strong>Hover</strong> over pooled cells to see which 2×2 region they came from</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-600">•</span>
              <span>Try different <strong>pooling types</strong> to see how they select values differently</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-600">•</span>
              <span>Notice how <strong>max pooling</strong> highlights the strongest features (brightest values)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-600">•</span>
              <span><strong>Global average pooling</strong> produces a single value from the entire feature map</span>
            </li>
          </ul>
        </div>
      </div>
    </Layout>
  );
}
