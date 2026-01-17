import { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { ControlPanel } from '@/components/ControlPanel';
import { InputImageGrid } from '@/components/InputImageGrid';
import { ConvolutionVisualization } from '@/components/ConvolutionVisualization';
import { FeatureMapDisplay } from '@/components/FeatureMapDisplay';
import { useCNNVisualization } from '@/hooks/useCNNVisualization';
import { mnistClassLabels, fashionMnistClassLabels } from '@/data/datasets';
import { Link } from 'react-router-dom';
import { ArrowRight, ArrowLeft, Lightbulb, Info, Layers } from 'lucide-react';
import { PipelineProgress } from '@/components/PipelinePrerequisite';
import { isConvolutionComplete as checkConvComplete, isActivationComplete as checkActComplete, isPoolingComplete as checkPoolComplete, isFlattenComplete as checkFlattenComplete, isDenseComplete as checkDenseComplete } from '@/lib/cnnStateStore';

export default function ConvolutionPage() {
  const {
    dataset,
    setDataset,
    selectedClass,
    filterType,
    inputImage,
    filter,
    featureMap,
    convStep,
    phase,
    isPlaying,
    isComplete,
    currentConvStep,
    totalConvSteps,
    convOutputSize,
    setSelectedClass,
    setFilterType,
    step,
    togglePlay,
    reset,
    padding,
    setPadding,
    stride,
    setStride,
    paddedInputSize,
    originalInputSize,
    isConvolutionComplete,
  } = useCNNVisualization();

  // Interactive feature: Highlight input region on feature map hover
  const [highlightInputRegion, setHighlightInputRegion] = useState<null | { row: number; col: number }>(null);
  const [convolutionHighlight, setConvolutionHighlight] = useState<null | {
    featureMapRow: number;
    featureMapCol: number;
    inputWindow: { row: number; col: number };
    dominantCellPosition: { row: number; col: number };
  }>(null);
  const [selectedConvStep, setSelectedConvStep] = useState<{
    row: number;
    col: number;
    inputWindow: number[][];
    filterWindow: number[][];
    multiplications: number[][];
    sum: number;
  } | null>(null);

  const handleFeatureMapCellHover = (fmRow: number, fmCol: number) => {
    setHighlightInputRegion({ row: fmRow, col: fmCol });
    const inputRowStart = fmRow * stride;
    const inputColStart = fmCol * stride;
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
        if (Math.abs(mult) > Math.abs(maxContribution)) {
          maxContribution = mult;
          dominantRow = pixelRow;
          dominantCol = pixelCol;
        }
      }
      inputWindow.push(inputRow);
      multiplications.push(multRow);
    }

    setSelectedConvStep({
      row: fmRow,
      col: fmCol,
      inputWindow,
      filterWindow: filter,
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

  const clearConvolutionHighlight = () => {
    setHighlightInputRegion(null);
    setConvolutionHighlight(null);
    setSelectedConvStep(null);
  };

  const currentClassName = dataset === 'mnist' 
    ? mnistClassLabels[selectedClass] 
    : fashionMnistClassLabels[selectedClass];

  const displayFeatureMap = featureMap.length > 0
    ? featureMap
    : Array(convOutputSize).fill(null).map(() => Array(convOutputSize).fill(null));

  // Pipeline progress for navigation
  const pipelineStages = [
    { name: 'Convolution', route: '/convolution', isComplete: checkConvComplete(), isCurrent: true },
    { name: 'Activation', route: '/activation', isComplete: checkActComplete(), isCurrent: false },
    { name: 'Pooling', route: '/pooling', isComplete: checkPoolComplete(), isCurrent: false },
    { name: 'Flatten', route: '/flatten', isComplete: checkFlattenComplete(), isCurrent: false },
    { name: 'Dense', route: '/dense', isComplete: checkDenseComplete(), isCurrent: false },
  ];

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4">
        {/* Pipeline Progress */}
        <PipelineProgress stages={pipelineStages} />
        
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-br from-orange-400 to-orange-600 rounded-xl shadow-lg">
              <Layers className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-slate-800">
                Convolution Operation
              </h1>
              <p className="text-slate-600">Learn how filters extract features from images</p>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-slate-600 hover:text-indigo-600 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Link>
            <Link
              to="/activation"
              className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg font-medium hover:shadow-lg transition-all"
            >
              Next: Activation
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Educational Explanation */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl p-6 border border-orange-200">
            <div className="flex items-center gap-2 mb-3">
              <Info className="w-5 h-5 text-orange-600" />
              <h3 className="font-bold text-orange-800">What is Convolution?</h3>
            </div>
            <p className="text-sm text-slate-700 leading-relaxed">
              Convolution is a mathematical operation where a small <strong>filter (kernel)</strong> slides 
              across the input image. At each position, it multiplies overlapping values and sums them up 
              to produce a single output value.
            </p>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-200">
            <div className="flex items-center gap-2 mb-3">
              <Lightbulb className="w-5 h-5 text-blue-600" />
              <h3 className="font-bold text-blue-800">Why Use Convolution?</h3>
            </div>
            <p className="text-sm text-slate-700 leading-relaxed">
              Different filters detect different features: <strong>edges</strong>, <strong>corners</strong>, 
              <strong>textures</strong>. By stacking multiple convolution layers, CNNs learn to recognize 
              increasingly complex patterns.
            </p>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-200">
            <div className="flex items-center gap-2 mb-3">
              <ArrowRight className="w-5 h-5 text-green-600" />
              <h3 className="font-bold text-green-800">What Comes Next?</h3>
            </div>
            <p className="text-sm text-slate-700 leading-relaxed">
              After convolution, we apply an <strong>activation function</strong> (like ReLU) to introduce 
              non-linearity. This allows the network to learn complex, non-linear relationships in the data.
            </p>
          </div>
        </div>

        {/* Current Selection Info */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 text-center mb-6">
          <p className="text-sm text-slate-600">
            Currently visualizing:{' '}
            <span className="font-semibold text-slate-800">{dataset === 'mnist' ? 'MNIST' : 'Fashion-MNIST'}</span>
            {' → '}
            <span className="font-semibold text-orange-600">{selectedClass} - {currentClassName}</span>
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

        {/* Convolution Operation Display */}
        <div className="mb-6">
          <ConvolutionVisualization
            filter={filter}
            currentStep={selectedConvStep || currentConvStep}
            convStep={selectedConvStep ? (selectedConvStep.row * convOutputSize + selectedConvStep.col + 1) : convStep}
            totalSteps={totalConvSteps}
            phase={phase}
            isInteractive={!!selectedConvStep}
          />
        </div>

        {/* Main Visualization Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
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
          <FeatureMapDisplay
            featureMap={displayFeatureMap}
            size={convOutputSize}
            onCellHover={handleFeatureMapCellHover}
            onCellLeave={clearConvolutionHighlight}
            poolingHighlight={null}
            activationHighlight={null}
          />
        </div>

        {/* Formula and Tips */}
        <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-2xl p-6 text-white mb-8">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <span className="text-2xl">📐</span> Convolution Formula
          </h3>
          <div className="bg-white/10 rounded-xl p-4 font-mono text-center mb-4">
            <p className="text-lg">
              Output[i,j] = Σ (Input[i+m, j+n] × Filter[m,n])
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="bg-white/5 rounded-lg p-4">
              <h4 className="font-semibold text-orange-400 mb-2">Output Size Formula</h4>
              <p className="font-mono text-slate-300">
                Output = ⌊(N - K + 2P) / S⌋ + 1
              </p>
              <p className="text-slate-400 mt-2 text-xs">
                N = Input size, K = Kernel size, P = Padding, S = Stride
              </p>
            </div>
            <div className="bg-white/5 rounded-lg p-4">
              <h4 className="font-semibold text-orange-400 mb-2">Current Settings</h4>
              <p className="text-slate-300">
                Input: {paddedInputSize}×{paddedInputSize} | Kernel: 3×3 | Padding: {padding} | Stride: {stride}
              </p>
              <p className="text-slate-400 mt-2 text-xs">
                Output: {convOutputSize}×{convOutputSize} = {convOutputSize * convOutputSize} values
              </p>
            </div>
          </div>
        </div>

        {/* Tips Section */}
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 mb-8">
          <h3 className="font-bold text-amber-800 mb-3 flex items-center gap-2">
            <span className="text-xl">💡</span> Interactive Tips
          </h3>
          <ul className="space-y-2 text-sm text-slate-700">
            <li className="flex items-start gap-2">
              <span className="text-amber-600">•</span>
              <span><strong>Hover</strong> over the feature map cells to see which input region contributed to that value</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-600">•</span>
              <span><strong>Change the filter</strong> to see how different edge detectors work</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-600">•</span>
              <span><strong>Adjust padding</strong> to see how it affects the output size</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-600">•</span>
              <span><strong>Increase stride</strong> to skip positions and reduce output dimensions</span>
            </li>
          </ul>
        </div>
      </div>
    </Layout>
  );
}
