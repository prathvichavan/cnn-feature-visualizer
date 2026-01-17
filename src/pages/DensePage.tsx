import { Layout } from '@/components/layout/Layout';
import { ControlPanel } from '@/components/ControlPanel';
import { DenseLayerVisualization } from '@/components/DenseLayerVisualization';
import { useCNNVisualization, StageStatus } from '@/hooks/useCNNVisualization';
import { mnistClassLabels, fashionMnistClassLabels } from '@/data/datasets';
import { Link } from 'react-router-dom';
import { ArrowRight, ArrowLeft, Lightbulb, Info, Brain, Trophy, Calculator } from 'lucide-react';
import { PipelinePrerequisite, PipelineProgress } from '@/components/PipelinePrerequisite';
import { isConvolutionComplete as checkConvComplete, isActivationComplete as checkActComplete, isPoolingComplete as checkPoolComplete, isFlattenComplete as checkFlattenComplete, isDenseComplete as checkDenseComplete } from '@/lib/cnnStateStore';

export default function DensePage() {
  const {
    dataset,
    setDataset,
    selectedClass,
    filterType,
    phase,
    isPlaying,
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
    isConvolutionComplete,
    flattenedVector,
    isFlattenComplete,
    denseLayerSize,
    setDenseLayerSize,
    selectedNeuron,
    setSelectedNeuron,
    denseWeights,
    denseBiases,
    denseStep,
    denseRunningSum,
    denseCurrentMultiplication,
    denseNeuronOutputs,
    denseActivatedOutputs,
    isDensePlaying,
    isDenseComplete,
    isNeuronComplete,
    denseActivationType,
    setDenseActivationType,
    showTopK,
    setShowTopK,
    denseStatus,
    startDense,
    stepDense,
    toggleDensePlay,
    resetDense,
  } = useCNNVisualization();

  const currentClassName = dataset === 'mnist'
    ? mnistClassLabels[selectedClass]
    : fashionMnistClassLabels[selectedClass];

  // Pipeline progress for navigation
  const pipelineStages = [
    { name: 'Convolution', route: '/convolution', isComplete: checkConvComplete(), isCurrent: false },
    { name: 'Activation', route: '/activation', isComplete: checkActComplete(), isCurrent: false },
    { name: 'Pooling', route: '/pooling', isComplete: checkPoolComplete(), isCurrent: false },
    { name: 'Flatten', route: '/flatten', isComplete: checkFlattenComplete(), isCurrent: false },
    { name: 'Dense', route: '/dense', isComplete: checkDenseComplete(), isCurrent: true },
  ];

  // Check prerequisite - Dense needs Flatten completed
  const prerequisite = !isFlattenComplete 
    ? { stageName: 'Flatten', stageRoute: '/flatten', isComplete: false }
    : null;

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4">
        {/* Pipeline Progress */}
        <PipelineProgress stages={pipelineStages} />
        
        {/* Prerequisite Warning */}
        <PipelinePrerequisite 
          prerequisite={prerequisite}
          currentStageName="Dense Layer"
        />
        
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-br from-purple-400 to-purple-600 rounded-xl shadow-lg">
              <Brain className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-slate-800">
                Dense Layer + Softmax
              </h1>
              <p className="text-slate-600">Make final predictions from extracted features</p>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <Link
              to="/flatten"
              className="inline-flex items-center gap-2 text-slate-600 hover:text-indigo-600 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back: Flatten
            </Link>
            <Link
              to="/architecture"
              className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg font-medium hover:shadow-lg transition-all"
            >
              View Full Architecture
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Educational Explanation */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-2xl p-6 border border-purple-200">
            <div className="flex items-center gap-2 mb-3">
              <Info className="w-5 h-5 text-purple-600" />
              <h3 className="font-bold text-purple-800">What is a Dense Layer?</h3>
            </div>
            <p className="text-sm text-slate-700 leading-relaxed">
              A dense (fully connected) layer connects <strong>every input</strong> to <strong>every neuron</strong>. 
              Each neuron computes a weighted sum of all inputs plus a bias, then applies an activation function.
            </p>
          </div>

          <div className="bg-gradient-to-br from-pink-50 to-rose-50 rounded-2xl p-6 border border-pink-200">
            <div className="flex items-center gap-2 mb-3">
              <Lightbulb className="w-5 h-5 text-pink-600" />
              <h3 className="font-bold text-pink-800">What is Softmax?</h3>
            </div>
            <p className="text-sm text-slate-700 leading-relaxed">
              <strong>Softmax</strong> converts raw outputs into probabilities that sum to 1. 
              The class with the highest probability becomes the prediction. It's used in the 
              final layer for multi-class classification.
            </p>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-200">
            <div className="flex items-center gap-2 mb-3">
              <Trophy className="w-5 h-5 text-green-600" />
              <h3 className="font-bold text-green-800">Making Predictions</h3>
            </div>
            <p className="text-sm text-slate-700 leading-relaxed">
              The final prediction is the class with the <strong>highest softmax probability</strong> (argmax). 
              For MNIST, this means selecting which digit (0-9) the network believes the image shows.
            </p>
          </div>
        </div>

        {/* Dense Layer Computation */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-8">
          <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Calculator className="w-5 h-5 text-purple-600" />
            How Dense Layers Work
          </h3>
          
          <div className="bg-gradient-to-r from-slate-50 to-purple-50 rounded-xl p-6">
            <div className="flex flex-col lg:flex-row items-center justify-center gap-8">
              {/* Input Vector */}
              <div className="text-center">
                <p className="text-sm font-medium text-slate-600 mb-3">Flattened Input</p>
                <div className="flex flex-col gap-1 bg-white p-3 rounded-xl shadow-sm">
                  {['x₁', 'x₂', 'x₃', '...', 'xₙ'].map((label, i) => (
                    <div key={i} className="w-12 h-8 bg-cyan-100 rounded flex items-center justify-center text-xs font-mono text-cyan-700">
                      {label}
                    </div>
                  ))}
                </div>
              </div>

              {/* Weights */}
              <div className="text-center">
                <p className="text-sm font-medium text-slate-600 mb-3">× Weights</p>
                <div className="bg-white p-3 rounded-xl shadow-sm">
                  <div className="grid grid-cols-3 gap-1">
                    {Array(15).fill(0).map((_, i) => (
                      <div key={i} className="w-8 h-8 bg-purple-100 rounded flex items-center justify-center text-[10px] font-mono text-purple-700">
                        w
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Plus Bias */}
              <div className="text-center">
                <p className="text-sm font-medium text-slate-600 mb-3">+ Bias</p>
                <div className="flex flex-col gap-1 bg-white p-3 rounded-xl shadow-sm">
                  {['b₁', 'b₂', 'b₃'].map((label, i) => (
                    <div key={i} className="w-12 h-8 bg-amber-100 rounded flex items-center justify-center text-xs font-mono text-amber-700">
                      {label}
                    </div>
                  ))}
                </div>
              </div>

              {/* Arrow */}
              <ArrowRight className="w-8 h-8 text-purple-500" />

              {/* Output */}
              <div className="text-center">
                <p className="text-sm font-medium text-slate-600 mb-3">Output</p>
                <div className="flex flex-col gap-1 bg-white p-3 rounded-xl shadow-sm">
                  {['y₁', 'y₂', 'y₃'].map((label, i) => (
                    <div key={i} className="w-12 h-8 bg-green-100 rounded flex items-center justify-center text-xs font-mono text-green-700">
                      {label}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Formula */}
          <div className="mt-4 bg-slate-800 rounded-xl p-4 text-white font-mono text-center">
            <p className="text-sm mb-1 text-slate-400">For each neuron j:</p>
            <p className="text-lg">
              y<sub>j</sub> = Σ (x<sub>i</sub> × w<sub>ij</sub>) + b<sub>j</sub>
            </p>
          </div>
        </div>

        {/* Softmax Explanation */}
        <div className="bg-gradient-to-r from-pink-600 to-rose-600 rounded-2xl p-6 text-white mb-8">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <span className="text-2xl">📊</span> Softmax Activation
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-pink-200 mb-3">Formula</h4>
              <div className="bg-white/10 rounded-xl p-4 font-mono text-center">
                <p className="text-lg">
                  softmax(z<sub>i</sub>) = e<sup>z<sub>i</sub></sup> / Σ e<sup>z<sub>j</sub></sup>
                </p>
              </div>
              <p className="text-sm text-pink-100 mt-3">
                Converts any vector of real numbers into a probability distribution.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-pink-200 mb-3">Example</h4>
              <div className="bg-white/10 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-pink-100">Raw scores:</span>
                  <span className="font-mono">[2.0, 1.0, 0.5]</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-pink-100">Softmax:</span>
                  <span className="font-mono">[0.59, 0.24, 0.17]</span>
                </div>
                <p className="text-xs text-pink-200 mt-2">Sum = 1.0 ✓</p>
              </div>
            </div>
          </div>
        </div>

        {/* Current Selection Info */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 text-center mb-6">
          <p className="text-sm text-slate-600">
            Currently visualizing:{' '}
            <span className="font-semibold text-slate-800">{dataset === 'mnist' ? 'MNIST' : 'Fashion-MNIST'}</span>
            {' → '}
            <span className="font-semibold text-purple-600">{selectedClass} - {currentClassName}</span>
            {!isFlattenComplete && (
              <span className="text-orange-600 ml-2">(Complete flatten first)</span>
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

        {/* Dense Layer Visualization */}
        <div className="mb-8">
          <DenseLayerVisualization
            flattenedVector={flattenedVector}
            isFlattenComplete={isFlattenComplete}
            denseLayerSize={denseLayerSize}
            selectedNeuron={selectedNeuron}
            weights={denseWeights}
            biases={denseBiases}
            denseStep={denseStep}
            runningSum={denseRunningSum}
            currentMultiplication={denseCurrentMultiplication}
            neuronOutputs={denseNeuronOutputs}
            activatedOutputs={denseActivatedOutputs}
            onDenseLayerSizeChange={setDenseLayerSize}
            onSelectedNeuronChange={setSelectedNeuron}
            onStep={stepDense}
            onTogglePlay={toggleDensePlay}
            onReset={resetDense}
            isPlaying={isDensePlaying}
            isDenseComplete={isDenseComplete}
            isNeuronComplete={isNeuronComplete}
            denseActivationType={denseActivationType}
            onDenseActivationTypeChange={setDenseActivationType}
            status={denseStatus}
            onStartDense={startDense}
            phase={phase}
            showTopK={showTopK}
            onShowTopKChange={setShowTopK}
            topK={20}
          />
        </div>

        {/* Predicted vs Inspected */}
        <div className="bg-gradient-to-r from-indigo-100 to-purple-100 rounded-2xl p-6 mb-8 border border-indigo-200">
          <h3 className="font-bold text-indigo-800 mb-4 flex items-center gap-2">
            <Trophy className="w-5 h-5" />
            Understanding Predictions
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <h4 className="font-semibold text-green-700 mb-2 flex items-center gap-2">
                <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                Predicted Neuron
              </h4>
              <p className="text-sm text-slate-600">
                The neuron with the <strong>highest softmax probability</strong>. 
                This is the network's best guess for what digit the image shows.
              </p>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <h4 className="font-semibold text-blue-700 mb-2 flex items-center gap-2">
                <span className="w-3 h-3 bg-blue-500 rounded-full"></span>
                Inspected Neuron
              </h4>
              <p className="text-sm text-slate-600">
                The neuron you're currently examining. You can click on any neuron 
                to see its weights and computation details.
              </p>
            </div>
          </div>
        </div>

        {/* Tips */}
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 mb-8">
          <h3 className="font-bold text-amber-800 mb-3 flex items-center gap-2">
            <span className="text-xl">💡</span> Interactive Tips
          </h3>
          <ul className="space-y-2 text-sm text-slate-700">
            <li className="flex items-start gap-2">
              <span className="text-amber-600">•</span>
              <span><strong>Click on neurons</strong> to see their individual weight × input calculations</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-600">•</span>
              <span>Enable <strong>Softmax</strong> to see probability outputs instead of raw values</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-600">•</span>
              <span>The neuron with the <strong>highest softmax value</strong> is highlighted as the prediction</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-600">•</span>
              <span>Use <strong>Show Top-K</strong> to see which inputs contribute most to each neuron's output</span>
            </li>
          </ul>
        </div>
      </div>
    </Layout>
  );
}
