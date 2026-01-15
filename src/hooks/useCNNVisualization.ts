import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { mnistSamples, fashionMnistSamples, filters, FilterType, DatasetType } from '@/data/datasets';

// Pooling type options
export type PoolingType = 'max' | 'min' | 'average' | 'globalAverage';

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
  maxValue: number;      // Used for max pooling
  minValue?: number;     // Used for min pooling
  avgValue?: number;     // Used for average pooling
  resultValue: number;   // The actual pooled result (max, min, or average)
  row: number;
  col: number;
  poolingType: PoolingType;
  // For min pooling: position of the min cell within the 2x2 window
  minCellPosition?: { i: number; j: number };
  // For max pooling: position of the max cell within the 2x2 window
  maxCellPosition?: { i: number; j: number };
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
  
  // NEW: Pooling type state
  const [poolingType, setPoolingType] = useState<PoolingType>('max');
  
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

  // Perform single pooling at position - supports max, min, average, globalAverage
  const performPooling = useCallback((row: number, col: number, fMap: number[][], type: PoolingType): PoolingStep => {
    const window: number[][] = [];
    let maxValue = -Infinity;
    let minValue = Infinity;
    let sum = 0;
    let maxCellPosition = { i: 0, j: 0 };
    let minCellPosition = { i: 0, j: 0 };
    
    for (let i = 0; i < 2; i++) {
      window[i] = [];
      for (let j = 0; j < 2; j++) {
        const value = fMap[row * 2 + i][col * 2 + j];
        window[i][j] = value;
        sum += value;
        
        if (value > maxValue) {
          maxValue = value;
          maxCellPosition = { i, j };
        }
        if (value < minValue) {
          minValue = value;
          minCellPosition = { i, j };
        }
      }
    }
    
    const avgValue = sum / 4;
    
    // Determine the result value based on pooling type
    let resultValue: number;
    switch (type) {
      case 'max':
        resultValue = maxValue;
        break;
      case 'min':
        resultValue = minValue;
        break;
      case 'average':
        resultValue = avgValue;
        break;
      case 'globalAverage':
        // For global average, this is calculated separately
        resultValue = avgValue;
        break;
      default:
        resultValue = maxValue;
    }
    
    return {
      window,
      maxValue,
      minValue,
      avgValue,
      resultValue,
      row,
      col,
      poolingType: type,
      maxCellPosition,
      minCellPosition,
    };
  }, []);
  
  // Perform global average pooling - computes the average of the entire feature map
  const performGlobalAveragePooling = useCallback((fMap: number[][]): number => {
    let sum = 0;
    let count = 0;
    for (let i = 0; i < fMap.length; i++) {
      for (let j = 0; j < fMap[i].length; j++) {
        if (fMap[i][j] !== null) {
          sum += fMap[i][j];
          count++;
        }
      }
    }
    return count > 0 ? sum / count : 0;
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

  // Reset pooling when pooling type changes (but keep convolution results)
  const resetPooling = useCallback(() => {
    setPoolStep(0);
    setPooledMap([]);
    setCurrentPoolStep(null);
    if (phase === 'pooling') {
      // Stay in pooling phase but reset its state
    }
    setIsPlaying(false);
    if (playIntervalRef.current) {
      clearInterval(playIntervalRef.current);
      playIntervalRef.current = null;
    }
  }, [phase]);

  // Reset pooling when pooling type changes
  useEffect(() => {
    resetPooling();
  }, [poolingType, resetPooling]);

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
      // Handle Global Average Pooling separately - it's a single step
      if (poolingType === 'globalAverage') {
        if (poolStep >= 1) {
          setIsPlaying(false);
          return;
        }
        
        // Use complete feature map for pooling
        const completeFeatureMap = featureMap.length > 0 ? featureMap : 
          Array(convOutputSize).fill(null).map((_, r) => 
            Array(convOutputSize).fill(null).map((_, c) => performConvolution(r, c).sum)
          );
        
        const globalAvg = performGlobalAveragePooling(completeFeatureMap);
        
        // Create a special pooling step for global average
        const stepResult: PoolingStep = {
          window: completeFeatureMap, // The entire feature map is the window
          maxValue: Math.max(...completeFeatureMap.flat()),
          minValue: Math.min(...completeFeatureMap.flat()),
          avgValue: globalAvg,
          resultValue: globalAvg,
          row: 0,
          col: 0,
          poolingType: 'globalAverage',
        };
        
        setCurrentPoolStep(stepResult);
        setPooledMap([[globalAvg]]); // 1x1 output
        setPoolStep(1);
        setIsPlaying(false);
        return;
      }
      
      // Standard pooling (max, min, average)
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
      
      const stepResult = performPooling(row, col, completeFeatureMap, poolingType);
      
      setCurrentPoolStep(stepResult);
      setPooledMap(prev => {
        const newMap = prev.length === 0 
          ? Array(poolOutputSize).fill(null).map(() => Array(poolOutputSize).fill(null))
          : prev.map(r => [...r]);
        newMap[row][col] = stepResult.resultValue;
        return newMap;
      });
      
      setPoolStep(prev => prev + 1);
      
      if (poolStep + 1 >= totalPoolSteps) {
        setIsPlaying(false);
      }
    }
  }, [phase, convStep, poolStep, totalConvSteps, totalPoolSteps, convOutputSize, poolOutputSize, 
      performConvolution, performPooling, performGlobalAveragePooling, featureMap, poolingType]);

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

  // Check if complete - handle global average pooling separately (only 1 step)
  const isComplete = phase === 'pooling' && (
    poolingType === 'globalAverage' ? poolStep >= 1 : poolStep >= totalPoolSteps
  );

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
    
    // NEW: Pooling type state
    poolingType,
    setPoolingType,
    
    // Actions
    setSelectedClass,
    setFilterType,
    step,
    togglePlay,
    reset,
  };
}
