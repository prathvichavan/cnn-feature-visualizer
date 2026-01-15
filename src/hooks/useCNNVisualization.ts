import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { mnistSamples, fashionMnistSamples, filters, FilterType, DatasetType } from '@/data/datasets';

export interface ConvolutionStep {
  inputWindow: number[][];
  filterWindow: number[][];
  multiplications: number[][];
  sum: number;
  row: number;
  col: number;
}

export interface PoolingStep {
  window: number[][];
  maxValue: number;
  row: number;
  col: number;
}

export function useCNNVisualization() {
  const [dataset, setDataset] = useState<DatasetType>('mnist');
  const [selectedClass, setSelectedClass] = useState<number>(7);
  const [filterType, setFilterType] = useState<FilterType>('topEdge');
  const [convStep, setConvStep] = useState(0);
  const [poolStep, setPoolStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [phase, setPhase] = useState<'convolution' | 'pooling'>('convolution');
  const [featureMap, setFeatureMap] = useState<number[][]>([]);
  const [pooledMap, setPooledMap] = useState<number[][]>([]);
  const [currentConvStep, setCurrentConvStep] = useState<ConvolutionStep | null>(null);
  const [currentPoolStep, setCurrentPoolStep] = useState<PoolingStep | null>(null);
  
  // NEW: Padding and Stride state
  const [padding, setPadding] = useState<number>(0); // 0, 1, or 2
  const [stride, setStride] = useState<number>(1);   // 1 or 2
  
  const playIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Get input image based on selected class and dataset
  const originalInputImage = dataset === 'mnist' ? mnistSamples[selectedClass] : fashionMnistSamples[selectedClass];
  const filter = filters[filterType];
  
  // Original input size (MNIST is 28x28)
  const originalInputSize = 28;
  
  // Padded input size: original + 2 * padding
  const paddedInputSize = originalInputSize + 2 * padding;
  
  // Create padded input image (with zero padding around edges)
  const inputImage = useMemo(() => {
    if (padding === 0) {
      return originalInputImage;
    }
    
    // Create new padded array filled with zeros
    const padded: number[][] = Array(paddedInputSize)
      .fill(null)
      .map(() => Array(paddedInputSize).fill(0));
    
    // Copy original image into the center
    for (let i = 0; i < originalInputSize; i++) {
      for (let j = 0; j < originalInputSize; j++) {
        padded[padding + i][padding + j] = originalInputImage[i][j];
      }
    }
    
    return padded;
  }, [originalInputImage, padding, paddedInputSize, originalInputSize]);
  
  // Kernel size (3x3 filter)
  const kernelSize = 3;
  
  // Output dimensions for convolution using formula:
  // Output size = floor((N - K + 2P) / S) + 1
  // where N = input size, K = kernel size, P = padding, S = stride
  const convOutputSize = Math.floor((originalInputSize - kernelSize + 2 * padding) / stride) + 1;
  
  // Output dimensions for pooling (2x2 pooling with stride 2)
  // Pooling output = floor(convOutputSize / 2)
  const poolOutputSize = Math.floor(convOutputSize / 2);
  
  const totalConvSteps = convOutputSize * convOutputSize;
  const totalPoolSteps = poolOutputSize * poolOutputSize;

  // Perform single convolution at position
  // Note: row and col represent the OUTPUT position
  // We need to calculate the input window position using stride
  const performConvolution = useCallback((row: number, col: number): ConvolutionStep => {
    const inputWindow: number[][] = [];
    const multiplications: number[][] = [];
    let sum = 0;
    
    // Calculate starting position in the (padded) input image
    // For stride > 1, we multiply the output position by stride
    const inputRowStart = row * stride;
    const inputColStart = col * stride;
    
    for (let i = 0; i < 3; i++) {
      inputWindow[i] = [];
      multiplications[i] = [];
      for (let j = 0; j < 3; j++) {
        const pixelValue = inputImage[inputRowStart + i][inputColStart + j];
        const filterValue = filter[i][j];
        inputWindow[i][j] = pixelValue;
        multiplications[i][j] = pixelValue * filterValue;
        sum += multiplications[i][j];
      }
    }
    
    return { inputWindow, filterWindow: filter, multiplications, sum, row, col };
  }, [inputImage, filter, stride]);

  // Perform single pooling at position
  const performPooling = useCallback((row: number, col: number, fMap: number[][]): PoolingStep => {
    const window: number[][] = [];
    let maxValue = -Infinity;
    
    for (let i = 0; i < 2; i++) {
      window[i] = [];
      for (let j = 0; j < 2; j++) {
        const value = fMap[row * 2 + i][col * 2 + j];
        window[i][j] = value;
        maxValue = Math.max(maxValue, value);
      }
    }
    
    return { window, maxValue, row, col };
  }, []);

  // Initialize/reset
  const reset = useCallback(() => {
    setConvStep(0);
    setPoolStep(0);
    setPhase('convolution');
    setFeatureMap([]);
    setPooledMap([]);
    setCurrentConvStep(null);
    setCurrentPoolStep(null);
    setIsPlaying(false);
    if (playIntervalRef.current) {
      clearInterval(playIntervalRef.current);
      playIntervalRef.current = null;
    }
  }, []);

  // Reset when class, filter, padding, or stride changes
  useEffect(() => {
    reset();
  }, [selectedClass, filterType, dataset, padding, stride, reset]);

  // Step forward
  const step = useCallback(() => {
    if (phase === 'convolution') {
      if (convStep >= totalConvSteps) {
        setPhase('pooling');
        return;
      }
      
      const row = Math.floor(convStep / convOutputSize);
      const col = convStep % convOutputSize;
      const stepResult = performConvolution(row, col);
      
      setCurrentConvStep(stepResult);
      setFeatureMap(prev => {
        const newMap = prev.length === 0 
          ? Array(convOutputSize).fill(null).map(() => Array(convOutputSize).fill(null))
          : prev.map(r => [...r]);
        newMap[row][col] = stepResult.sum;
        return newMap;
      });
      
      setConvStep(prev => prev + 1);
      
      // Check if convolution is complete
      if (convStep + 1 >= totalConvSteps) {
        setPhase('pooling');
      }
    } else {
      if (poolStep >= totalPoolSteps) {
        setIsPlaying(false);
        return;
      }
      
      const row = Math.floor(poolStep / poolOutputSize);
      const col = poolStep % poolOutputSize;
      
      // Use complete feature map for pooling
      const completeFeatureMap = featureMap.length > 0 ? featureMap : 
        Array(convOutputSize).fill(null).map((_, r) => 
          Array(convOutputSize).fill(null).map((_, c) => performConvolution(r, c).sum)
        );
      
      const stepResult = performPooling(row, col, completeFeatureMap);
      
      setCurrentPoolStep(stepResult);
      setPooledMap(prev => {
        const newMap = prev.length === 0 
          ? Array(poolOutputSize).fill(null).map(() => Array(poolOutputSize).fill(null))
          : prev.map(r => [...r]);
        newMap[row][col] = stepResult.maxValue;
        return newMap;
      });
      
      setPoolStep(prev => prev + 1);
      
      if (poolStep + 1 >= totalPoolSteps) {
        setIsPlaying(false);
      }
    }
  }, [phase, convStep, poolStep, totalConvSteps, totalPoolSteps, convOutputSize, poolOutputSize, 
      performConvolution, performPooling, featureMap]);

  // Play/pause animation
  const togglePlay = useCallback(() => {
    if (isPlaying) {
      setIsPlaying(false);
      if (playIntervalRef.current) {
        clearInterval(playIntervalRef.current);
        playIntervalRef.current = null;
      }
    } else {
      setIsPlaying(true);
    }
  }, [isPlaying]);

  // Auto-step when playing
  useEffect(() => {
    if (isPlaying) {
      playIntervalRef.current = setInterval(() => {
        step();
      }, 50); // Slower interval for proper rendering
    }
    
    return () => {
      if (playIntervalRef.current) {
        clearInterval(playIntervalRef.current);
      }
    };
  }, [isPlaying, step]);

  // Check if complete
  const isComplete = phase === 'pooling' && poolStep >= totalPoolSteps;

  return {
    // State
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
    
    // NEW: Padding and Stride state
    padding,
    setPadding,
    stride,
    setStride,
    paddedInputSize,
    originalInputSize,
    
    // Actions
    setSelectedClass,
    setFilterType,
    step,
    togglePlay,
    reset,
  };
}
