import { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { ControlPanel } from '@/components/ControlPanel';
import { FeatureMapDisplay } from '@/components/FeatureMapDisplay';
import { ActivationVisualization } from '@/components/ActivationVisualization';
import { useCNNVisualization, StageStatus } from '@/hooks/useCNNVisualization';
import { mnistClassLabels, fashionMnistClassLabels } from '@/data/datasets';
import { Link } from 'react-router-dom';
import { ArrowRight, ArrowLeft, Lightbulb, Info, Zap, TrendingUp } from 'lucide-react';
import { PipelinePrerequisite, PipelineProgress } from '@/components/PipelinePrerequisite';
import { isConvolutionComplete as checkConvComplete, isActivationComplete as checkActComplete, isPoolingComplete as checkPoolComplete, isFlattenComplete as checkFlattenComplete, isDenseComplete as checkDenseComplete } from '@/lib/cnnStateStore';

export default function ActivationPage() {
  const {
    dataset,
    setDataset,
    selectedClass,
    filterType,
    featureMap,
    convStep,
    phase,
    isPlaying,
    currentConvStep,
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
    activationType,
    setActivationType,
    displayedActivationMap,
    activationStep,
    totalActivationSteps,
    isActivationPlaying,
    isActivationComplete,
    stepActivation,
    toggleActivationPlay,
    resetActivation,
    startActivation,
    convolutionStatus,
    activationStatus,
    isConvolutionComplete,
    poolingSource,
    setPoolingSource,
  } = useCNNVisualization();

  const [activationHighlight, setActivationHighlight] = useState<null | { row: number; col: number }>(null);

  const currentClassName = dataset === 'mnist'
    ? mnistClassLabels[selectedClass]
    : fashionMnistClassLabels[selectedClass];

  const displayFeatureMap = featureMap.length > 0
    ? featureMap
    : Array(convOutputSize).fill(null).map(() => Array(convOutputSize).fill(null));

  // Pipeline progress for navigation
  const pipelineStages = [
    { name: 'Convolution', route: '/convolution', isComplete: checkConvComplete(), isCurrent: false },
    { name: 'Activation', route: '/activation', isComplete: checkActComplete(), isCurrent: true },
    { name: 'Pooling', route: '/pooling', isComplete: checkPoolComplete(), isCurrent: false },
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
          currentStageName="Activation"
        />
        
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-br from-yellow-400 to-amber-600 rounded-xl shadow-lg">
              <Zap className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-slate-800">
                Activation Functions
              </h1>
              <p className="text-slate-600">Learn how non-linearity enables complex pattern learning</p>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <Link
              to="/convolution"
              className="inline-flex items-center gap-2 text-slate-600 hover:text-indigo-600 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back: Convolution
            </Link>
            <Link
              to="/pooling"
              className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-yellow-500 to-amber-600 text-white rounded-lg font-medium hover:shadow-lg transition-all"
            >
              Next: Pooling
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Educational Explanation */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-br from-yellow-50 to-amber-50 rounded-2xl p-6 border border-yellow-200">
            <div className="flex items-center gap-2 mb-3">
              <Info className="w-5 h-5 text-yellow-600" />
              <h3 className="font-bold text-yellow-800">What is Activation?</h3>
            </div>
            <p className="text-sm text-slate-700 leading-relaxed">
              Activation functions introduce <strong>non-linearity</strong> into the network. 
              Without them, stacking multiple layers would be equivalent to a single linear transformation, 
              limiting what the network can learn.
            </p>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-200">
            <div className="flex items-center gap-2 mb-3">
              <Lightbulb className="w-5 h-5 text-blue-600" />
              <h3 className="font-bold text-blue-800">Why ReLU is Popular?</h3>
            </div>
            <p className="text-sm text-slate-700 leading-relaxed">
              <strong>ReLU (Rectified Linear Unit)</strong> is simple and fast: it keeps positive values 
              unchanged and sets negative values to zero. This sparsity helps with efficient computation 
              and reduces overfitting.
            </p>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-200">
            <div className="flex items-center gap-2 mb-3">
              <ArrowRight className="w-5 h-5 text-green-600" />
              <h3 className="font-bold text-green-800">What Comes Next?</h3>
            </div>
            <p className="text-sm text-slate-700 leading-relaxed">
              After activation, we apply <strong>pooling</strong> to reduce the spatial dimensions 
              of the feature maps. This makes the network more efficient and helps it focus on the 
              most important features.
            </p>
          </div>
        </div>

        {/* Activation Functions Comparison (hidden) */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-8">
          <h2 className="text-xl font-bold mb-4 text-slate-800 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-amber-600" />
            Activation Functions Comparison
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* ReLU Card */}
            <div className="border rounded-xl p-4 flex flex-col items-center bg-gradient-to-br from-yellow-50 to-amber-50">
              <div className="font-bold text-lg text-yellow-700 mb-2">ReLU</div>
              <div className="text-sm text-slate-700 mb-2 text-center">f(x) = max(0, x)</div>
              <div className="flex gap-1 mb-2">
                <span className="bg-red-200 text-red-700 rounded px-2">-2</span>
                <span className="bg-yellow-200 text-yellow-700 rounded px-2">0</span>
                <span className="bg-green-200 text-green-700 rounded px-2">3</span>
              </div>
              <div className="text-xs text-slate-600 text-center">Negative values become 0, positive stay same.</div>
            </div>
            {/* Sigmoid Card */}
            <div className="border rounded-xl p-4 flex flex-col items-center bg-gradient-to-br from-blue-50 to-indigo-50">
              <div className="font-bold text-lg text-blue-700 mb-2">Sigmoid</div>
              <div className="text-sm text-slate-700 mb-2 text-center">f(x) = 1 / (1 + e<sup>-x</sup>)</div>
              <div className="flex gap-1 mb-2">
                <span className="bg-blue-200 text-blue-700 rounded px-2">0.12</span>
                <span className="bg-blue-300 text-blue-800 rounded px-2">0.50</span>
                <span className="bg-blue-400 text-white rounded px-2">0.95</span>
              </div>
              <div className="text-xs text-slate-600 text-center">Squashes values between 0 and 1.</div>
            </div>
            {/* Softmax Card */}
            <div className="border rounded-xl p-4 flex flex-col items-center bg-gradient-to-br from-purple-50 to-fuchsia-50">
              <div className="font-bold text-lg text-purple-700 mb-2">Softmax</div>
              <div className="text-sm text-slate-700 mb-2 text-center">f(x<sub>i</sub>) = e<sup>x<sub>i</sub></sup> / Σ e<sup>x<sub>j</sub></sup></div>
              <div className="flex gap-1 mb-2">
                <span className="bg-purple-200 text-purple-700 rounded px-2">0.05</span>
                <span className="bg-purple-300 text-purple-800 rounded px-2">0.20</span>
                <span className="bg-purple-400 text-white rounded px-2">0.75</span>
              </div>
              <div className="text-xs text-slate-600 text-center">Turns scores into probabilities (sum to 1).</div>
            </div>
          </div>
        </div>

        {/* Current Selection Info */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 text-center mb-6">
          <p className="text-sm text-slate-600">
            Currently visualizing:{' '}
            <span className="font-semibold text-slate-800">{dataset === 'mnist' ? 'MNIST' : 'Fashion-MNIST'}</span>
            {' → '}
            <span className="font-semibold text-amber-600">{selectedClass} - {currentClassName}</span>
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

        {/* Activation Pipeline: Input and Output Only */}
        {/* Input and Activation Output Side by Side Layout */}
        <div className="mb-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Input to Activation */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
            <div className="mb-2 font-semibold text-orange-700">Input to Activation (Output of Convolution)</div>
            <FeatureMapDisplay
              featureMap={displayFeatureMap}
              size={convOutputSize}
              poolingHighlight={null}
              activationHighlight={activationHighlight}
            />
          </div>
          {/* Right: Activation Function and Output */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
            <ActivationVisualization
              featureMap={displayFeatureMap}
              activatedMap={displayedActivationMap.length > 0
                ? displayedActivationMap
                : Array(convOutputSize).fill(null).map(() => Array(convOutputSize).fill(null))}
              size={convOutputSize}
              activationType={activationType}
              onActivationTypeChange={setActivationType}
              poolingSource={"activated"}
              onPoolingSourceChange={() => {}}
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
              onActivatedCellHover={(row, col) => setActivationHighlight({ row, col })}
              onActivatedCellLeave={() => setActivationHighlight(null)}
              stride={stride}
            />
          </div>
        </div>

        {/* Activation Controls and Function Selector (Duplicate Section Hidden) */}
        {false && (
          <div className="mb-8">
            <ActivationVisualization
              featureMap={displayFeatureMap}
              activatedMap={displayedActivationMap.length > 0
                ? displayedActivationMap
                : Array(convOutputSize).fill(null).map(() => Array(convOutputSize).fill(null))}
              size={convOutputSize}
              activationType={activationType}
              onActivationTypeChange={setActivationType}
              poolingSource={"activated"}
              onPoolingSourceChange={() => {}}
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
              onActivatedCellHover={(row, col) => setActivationHighlight({ row, col })}
              onActivatedCellLeave={() => setActivationHighlight(null)}
              stride={stride}
            />
          </div>
        )}

        {/* Proceed to Pooling Navigation */}
        <div className="flex justify-end mb-8">
          <Link
            to="/pooling"
            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-yellow-500 to-amber-600 text-white rounded-lg font-medium hover:shadow-lg transition-all"
          >
            Proceed to Pooling
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* ReLU Deep Dive */}
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl p-6 text-white mb-8">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <span className="text-2xl">🧮</span> ReLU Deep Dive
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white/10 rounded-xl p-4">
              <h4 className="font-semibold text-green-200 mb-3">Before ReLU</h4>
              <div className="grid grid-cols-3 gap-2 text-center font-mono text-sm">
                <div className="bg-red-500/40 rounded p-2">-50</div>
                <div className="bg-green-500/40 rounded p-2">120</div>
                <div className="bg-red-500/40 rounded p-2">-30</div>
                <div className="bg-green-500/40 rounded p-2">85</div>
                <div className="bg-red-500/40 rounded p-2">-15</div>
                <div className="bg-green-500/40 rounded p-2">200</div>
              </div>
            </div>
            <div className="bg-white/10 rounded-xl p-4">
              <h4 className="font-semibold text-green-200 mb-3">After ReLU</h4>
              <div className="grid grid-cols-3 gap-2 text-center font-mono text-sm">
                <div className="bg-slate-500/40 rounded p-2">0</div>
                <div className="bg-green-500/40 rounded p-2">120</div>
                <div className="bg-slate-500/40 rounded p-2">0</div>
                <div className="bg-green-500/40 rounded p-2">85</div>
                <div className="bg-slate-500/40 rounded p-2">0</div>
                <div className="bg-green-500/40 rounded p-2">200</div>
              </div>
            </div>
          </div>
          <p className="text-sm text-green-100 mt-4">
            <strong>Key insight:</strong> ReLU creates sparsity by zeroing out negative values. 
            This makes the network focus only on activated (relevant) features.
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
              <span>First <strong>complete the convolution</strong> step, then start the activation</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-600">•</span>
              <span>Try different <strong>activation functions</strong> to see how they transform the feature map</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-600">•</span>
              <span>Notice how <strong>ReLU zeros out negative values</strong> (shown in blue becoming gray)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-600">•</span>
              <span>Select <strong>pooling source</strong> to decide if pooling uses raw or activated values</span>
            </li>
          </ul>
        </div>
      </div>
    </Layout>
  );
}
