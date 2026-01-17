import { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { ControlPanel } from '@/components/ControlPanel';
import { FlattenVisualization } from '@/components/FlattenVisualization';
import { useCNNVisualization, StageStatus } from '@/hooks/useCNNVisualization';
import { mnistClassLabels, fashionMnistClassLabels } from '@/data/datasets';
import { Link } from 'react-router-dom';
import { ArrowRight, ArrowLeft, Lightbulb, Info, ArrowDownWideNarrow, Rows3 } from 'lucide-react';
import { PipelinePrerequisite, PipelineProgress } from '@/components/PipelinePrerequisite';
import { isConvolutionComplete as checkConvComplete, isActivationComplete as checkActComplete, isPoolingComplete as checkPoolComplete, isFlattenComplete as checkFlattenComplete, isDenseComplete as checkDenseComplete } from '@/lib/cnnStateStore';

export default function FlattenPage() {
  const {
    dataset,
    setDataset,
    selectedClass,
    filterType,
    featureMap,
    pooledMap,
    phase,
    isPlaying,
    convOutputSize,
    poolOutputSize,
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
    displayedActivationMap,
    flattenSource,
    setFlattenSource,
    flattenedVector,
    flattenStep,
    totalFlattenSteps,
    isFlattenPlaying,
    isFlattenComplete,
    stepFlatten,
    toggleFlattenPlay,
    resetFlatten,
    startFlatten,
    flattenStatus,
  } = useCNNVisualization();

  const currentClassName = dataset === 'mnist'
    ? mnistClassLabels[selectedClass]
    : fashionMnistClassLabels[selectedClass];

  const displayFeatureMap = featureMap.length > 0
    ? featureMap
    : Array(convOutputSize).fill(null).map(() => Array(convOutputSize).fill(null));

  const displayPooledMap = pooledMap.length > 0
    ? pooledMap
    : Array(poolOutputSize).fill(null).map(() => Array(poolOutputSize).fill(null));

  // Calculate source size based on flatten source
  const sourceSize = flattenSource === 'pooled' ? poolOutputSize : convOutputSize;

  // Pipeline progress for navigation
  const pipelineStages = [
    { name: 'Convolution', route: '/convolution', isComplete: checkConvComplete(), isCurrent: false },
    { name: 'Activation', route: '/activation', isComplete: checkActComplete(), isCurrent: false },
    { name: 'Pooling', route: '/pooling', isComplete: checkPoolComplete(), isCurrent: false },
    { name: 'Flatten', route: '/flatten', isComplete: checkFlattenComplete(), isCurrent: true },
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
          currentStageName="Flatten"
        />
        
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-br from-cyan-400 to-cyan-600 rounded-xl shadow-lg">
              <ArrowDownWideNarrow className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-slate-800">
                Flatten Layer
              </h1>
              <p className="text-slate-600">Transform 2D feature maps into 1D vectors</p>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <Link
              to="/pooling"
              className="inline-flex items-center gap-2 text-slate-600 hover:text-indigo-600 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back: Pooling
            </Link>
            <Link
              to="/dense"
              className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-cyan-600 text-white rounded-lg font-medium hover:shadow-lg transition-all"
            >
              Next: Dense Layer
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Educational Explanation */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-br from-cyan-50 to-sky-50 rounded-2xl p-6 border border-cyan-200">
            <div className="flex items-center gap-2 mb-3">
              <Info className="w-5 h-5 text-cyan-600" />
              <h3 className="font-bold text-cyan-800">What is Flattening?</h3>
            </div>
            <p className="text-sm text-slate-700 leading-relaxed">
              Flattening <strong>reshapes a 2D matrix into a 1D vector</strong>. Each row of the 
              2D grid is concatenated one after another, reading left-to-right, top-to-bottom 
              (row-major order).
            </p>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-200">
            <div className="flex items-center gap-2 mb-3">
              <Lightbulb className="w-5 h-5 text-blue-600" />
              <h3 className="font-bold text-blue-800">Why Flatten?</h3>
            </div>
            <p className="text-sm text-slate-700 leading-relaxed">
              <strong>Dense (fully connected) layers</strong> require 1D input vectors. Flattening 
              bridges the gap between convolutional layers (which work on 2D spatial data) and 
              dense layers (which work on flat vectors).
            </p>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 border border-purple-200">
            <div className="flex items-center gap-2 mb-3">
              <ArrowRight className="w-5 h-5 text-purple-600" />
              <h3 className="font-bold text-purple-800">What Comes Next?</h3>
            </div>
            <p className="text-sm text-slate-700 leading-relaxed">
              The flattened vector feeds into <strong>dense layers</strong> where each neuron 
              connects to every input. Finally, <strong>softmax</strong> converts outputs to 
              class probabilities.
            </p>
          </div>
        </div>

        {/* Flatten Process Visualization */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-8">
          <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Rows3 className="w-5 h-5 text-cyan-600" />
            How Flattening Works
          </h3>
          
          <div className="flex flex-col lg:flex-row items-center justify-center gap-8">
            {/* 2D Grid */}
            <div className="text-center">
              <p className="text-sm font-medium text-slate-600 mb-3">2D Feature Map ({sourceSize}×{sourceSize})</p>
              <div className="inline-grid gap-1 bg-slate-100 p-3 rounded-xl" style={{ gridTemplateColumns: `repeat(${Math.min(sourceSize, 6)}, 1fr)` }}>
                {Array(Math.min(sourceSize * sourceSize, 36)).fill(0).map((_, i) => {
                  const row = Math.floor(i / Math.min(sourceSize, 6));
                  const col = i % Math.min(sourceSize, 6);
                  const colors = ['bg-red-200', 'bg-orange-200', 'bg-yellow-200', 'bg-green-200', 'bg-cyan-200', 'bg-blue-200'];
                  return (
                    <div
                      key={i}
                      className={`w-8 h-8 ${colors[row % 6]} rounded flex items-center justify-center text-[10px] font-mono text-slate-700`}
                    >
                      {row},{col}
                    </div>
                  );
                })}
              </div>
              {sourceSize > 6 && <p className="text-xs text-slate-400 mt-2">Showing 6×6 of {sourceSize}×{sourceSize}</p>}
            </div>

            {/* Arrow */}
            <div className="flex flex-col items-center gap-2">
              <ArrowRight className="w-12 h-12 text-cyan-500 rotate-90 lg:rotate-0" />
              <span className="text-xs text-slate-500 font-medium">Row-major order</span>
            </div>

            {/* 1D Vector */}
            <div className="text-center">
              <p className="text-sm font-medium text-slate-600 mb-3">1D Vector (length {sourceSize * sourceSize})</p>
              <div className="flex flex-wrap gap-1 bg-slate-100 p-3 rounded-xl max-w-xs justify-center">
                {Array(Math.min(sourceSize * sourceSize, 24)).fill(0).map((_, i) => {
                  const row = Math.floor(i / sourceSize);
                  const colors = ['bg-red-200', 'bg-orange-200', 'bg-yellow-200', 'bg-green-200', 'bg-cyan-200', 'bg-blue-200'];
                  return (
                    <div
                      key={i}
                      className={`w-6 h-6 ${colors[row % 6]} rounded flex items-center justify-center text-[8px] font-mono text-slate-700`}
                    >
                      {i}
                    </div>
                  );
                })}
                {sourceSize * sourceSize > 24 && (
                  <div className="w-6 h-6 bg-slate-300 rounded flex items-center justify-center text-[8px] font-mono text-slate-600">
                    ...
                  </div>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-2">Colors show which row each element came from</p>
            </div>
          </div>
        </div>

        {/* Index Mapping */}
        <div className="bg-gradient-to-r from-cyan-600 to-sky-600 rounded-2xl p-6 text-white mb-8">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <span className="text-2xl">🔢</span> Index Mapping Formula
          </h3>
          <div className="bg-white/10 rounded-xl p-4 font-mono text-center mb-4">
            <p className="text-lg mb-2">
              <span className="text-cyan-200">2D → 1D:</span> vector[<span className="text-yellow-300">i</span>] = grid[<span className="text-yellow-300">row</span>][<span className="text-yellow-300">col</span>]
            </p>
            <p className="text-lg">
              where <span className="text-yellow-300">i</span> = <span className="text-yellow-300">row</span> × width + <span className="text-yellow-300">col</span>
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="bg-white/5 rounded-lg p-4">
              <h4 className="font-semibold text-cyan-200 mb-2">Example: 3×3 Grid</h4>
              <p className="text-slate-200">
                grid[1][2] → vector[1×3 + 2] = vector[5]
              </p>
            </div>
            <div className="bg-white/5 rounded-lg p-4">
              <h4 className="font-semibold text-cyan-200 mb-2">Current Settings</h4>
              <p className="text-slate-200">
                {sourceSize}×{sourceSize} grid → {sourceSize * sourceSize} length vector
              </p>
            </div>
          </div>
        </div>

        {/* Current Selection Info */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 text-center mb-6">
          <p className="text-sm text-slate-600">
            Currently visualizing:{' '}
            <span className="font-semibold text-slate-800">{dataset === 'mnist' ? 'MNIST' : 'Fashion-MNIST'}</span>
            {' → '}
            <span className="font-semibold text-cyan-600">{selectedClass} - {currentClassName}</span>
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

        {/* Flatten Visualization */}
        <div className="mb-8">
          <FlattenVisualization
            featureMap={displayFeatureMap}
            activatedMap={displayedActivationMap.length > 0
              ? displayedActivationMap
              : Array(convOutputSize).fill(null).map(() => Array(convOutputSize).fill(null))}
            pooledMap={displayPooledMap}
            flattenedVector={flattenedVector}
            flattenStep={flattenStep}
            totalFlattenSteps={totalFlattenSteps}
            currentFlattenRow={flattenStep}
            flattenSource={flattenSource}
            onFlattenSourceChange={setFlattenSource}
            onStep={stepFlatten}
            onTogglePlay={toggleFlattenPlay}
            onReset={resetFlatten}
            isPlaying={isFlattenPlaying}
            isFlattenComplete={isFlattenComplete}
            status={flattenStatus}
            isConvolutionComplete={isConvolutionComplete}
            onStartFlatten={startFlatten}
            phase={phase}
          />
        </div>

        {/* Tips */}
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 mb-8">
          <h3 className="font-bold text-amber-800 mb-3 flex items-center gap-2">
            <span className="text-xl">💡</span> Interactive Tips
          </h3>
          <ul className="space-y-2 text-sm text-slate-700">
            <li className="flex items-start gap-2">
              <span className="text-amber-600">•</span>
              <span><strong>Hover</strong> over any cell in the vector to see its original 2D position</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-600">•</span>
              <span><strong>Watch the animation</strong> to see how rows are concatenated one by one</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-600">•</span>
              <span>Change the <strong>flatten source</strong> to use raw feature map, activated map, or pooled output</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-600">•</span>
              <span>The <strong>pooled output</strong> is typically used (smaller size = fewer parameters)</span>
            </li>
          </ul>
        </div>
      </div>
    </Layout>
  );
}
