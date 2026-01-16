import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { mnistSamples, fashionMnistSamples, filters, FilterType, DatasetType } from '@/data/datasets';

// Pooling type options
export type PoolingType = 'max' | 'min' | 'average' | 'globalAverage';

// Activation function types
export type ActivationType = 'none' | 'relu' | 'sigmoid' | 'softmax';

// Pooling source options
export type PoolingSourceType = 'raw' | 'activated';

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
  const [activationStep, setActivationStep] = useState(0); // NEW: Activation step counter
  const [isPlaying, setIsPlaying] = useState(false);
  const [phase, setPhase] = useState<'convolution' | 'activation' | 'pooling'>('convolution');
  const [featureMap, setFeatureMap] = useState<number[][]>([]);
  const [pooledMap, setPooledMap] = useState<number[][]>([]);
  const [currentConvStep, setCurrentConvStep] = useState<ConvolutionStep | null>(null);
  const [currentPoolStep, setCurrentPoolStep] = useState<PoolingStep | null>(null);
  
  // NEW: Padding and Stride state
  const [padding, setPadding] = useState<number>(0); // 0, 1, or 2
  const [stride, setStride] = useState<number>(1);   // 1 or 2
  
  // NEW: Pooling type state
  const [poolingType, setPoolingType] = useState<PoolingType>('max');
  
  // NEW: Activation function state
  const [activationType, setActivationType] = useState<ActivationType>('relu');
  
  // NEW: Activation-specific playing state
  const [isActivationPlaying, setIsActivationPlaying] = useState(false);
  const activationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // NEW: Pooling source state (raw feature map or activated feature map)
  const [poolingSource, setPoolingSource] = useState<PoolingSourceType>('activated');
  
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

  // Activation function implementations
  const applyReLU = useCallback((value: number): number => {
    return Math.max(0, value);
  }, []);

  const applySigmoid = useCallback((value: number): number => {
    return 1 / (1 + Math.exp(-value / 100)); // Scaled for better visualization
  }, []);

  const applySoftmax = useCallback((values: number[]): number[] => {
    // Find max for numerical stability
    const maxVal = Math.max(...values);
    const expValues = values.map(v => Math.exp((v - maxVal) / 100)); // Scaled for stability
    const sumExp = expValues.reduce((a, b) => a + b, 0);
    return expValues.map(v => v / sumExp);
  }, []);

  // Compute activated feature map based on activation type
  const activatedFeatureMap = useMemo(() => {
    if (featureMap.length === 0) return [];
    
    const rows = featureMap.length;
    const cols = featureMap[0].length;
    
    switch (activationType) {
      case 'none':
        return featureMap;
      
      case 'relu':
        return featureMap.map(row => 
          row.map(val => val !== null ? applyReLU(val) : null)
        );
      
      case 'sigmoid':
        return featureMap.map(row => 
          row.map(val => val !== null ? applySigmoid(val) : null)
        );
      
      case 'softmax': {
        // Flatten all non-null values
        const flatValues: number[] = [];
        const positions: { row: number; col: number }[] = [];
        
        for (let i = 0; i < rows; i++) {
          for (let j = 0; j < cols; j++) {
            if (featureMap[i][j] !== null) {
              flatValues.push(featureMap[i][j]);
              positions.push({ row: i, col: j });
            }
          }
        }
        
        if (flatValues.length === 0) return featureMap;
        
        // Apply softmax across all values
        const softmaxValues = applySoftmax(flatValues);
        
        // Reconstruct the 2D array
        const result: (number | null)[][] = featureMap.map(row => row.map(() => null));
        positions.forEach((pos, idx) => {
          result[pos.row][pos.col] = softmaxValues[idx];
        });
        
        return result;
      }
      
      default:
        return featureMap;
    }
  }, [featureMap, activationType, applyReLU, applySigmoid, applySoftmax]);

  // Total activation steps (same as total conv steps since it's element-wise)
  const totalActivationSteps = convOutputSize * convOutputSize;

  // Step-by-step activated feature map (shows progress of activation)
  const [displayedActivationMap, setDisplayedActivationMap] = useState<(number | null)[][]>([]);

  // Get the feature map to use for pooling based on poolingSource
  const poolingInputMap = useMemo(() => {
    if (poolingSource === 'activated') {
      // Use the step-by-step displayed activation map if in activation phase
      // Otherwise use the fully computed activated map
      return displayedActivationMap.length > 0 ? displayedActivationMap : activatedFeatureMap;
    }
    return featureMap;
  }, [poolingSource, displayedActivationMap, activatedFeatureMap, featureMap]);

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
    setActivationStep(0);
    setPhase('convolution');
    setFeatureMap([]);
    setPooledMap([]);
    setDisplayedActivationMap([]);
    setCurrentConvStep(null);
    setCurrentPoolStep(null);
    setIsPlaying(false);
    setIsActivationPlaying(false);
    if (playIntervalRef.current) {
      clearInterval(playIntervalRef.current);
      playIntervalRef.current = null;
    }
    if (activationIntervalRef.current) {
      clearInterval(activationIntervalRef.current);
      activationIntervalRef.current = null;
    }
  }, []);

  // Reset when class, filter, padding, or stride changes
  useEffect(() => {
    reset();
  }, [selectedClass, filterType, dataset, padding, stride, reset]);

  // NEW: Pooling-specific playing state
  const [isPoolingPlaying, setIsPoolingPlaying] = useState(false);
  const poolingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Reset activation when activation type changes (but keep convolution results)
  const resetActivation = useCallback(() => {
    setActivationStep(0);
    setDisplayedActivationMap([]);
    setPoolStep(0);
    setPooledMap([]);
    setCurrentPoolStep(null);
    if (phase === 'activation' || phase === 'pooling') {
      setPhase('activation');
    }
    setIsActivationPlaying(false);
    setIsPoolingPlaying(false);
    if (activationIntervalRef.current) {
      clearInterval(activationIntervalRef.current);
      activationIntervalRef.current = null;
    }
    if (poolingIntervalRef.current) {
      clearInterval(poolingIntervalRef.current);
      poolingIntervalRef.current = null;
    }
  }, [phase]);

  // Reset activation when activation type changes
  useEffect(() => {
    if (phase === 'activation' || phase === 'pooling') {
      resetActivation();
    }
  }, [activationType]);

  // Reset pooling when pooling type changes (but keep convolution results)
  const resetPooling = useCallback(() => {
    setPoolStep(0);
    setPooledMap([]);
    setCurrentPoolStep(null);
    if (phase === 'pooling') {
      // Stay in pooling phase but reset its state
    }
    setIsPlaying(false);
    setIsPoolingPlaying(false);
    if (playIntervalRef.current) {
      clearInterval(playIntervalRef.current);
      playIntervalRef.current = null;
    }
    if (poolingIntervalRef.current) {
      clearInterval(poolingIntervalRef.current);
      poolingIntervalRef.current = null;
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
        setPhase('activation');
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
        setPhase('activation');
      }
    } else if (phase === 'activation') {
      // Handle activation phase
      if (activationStep >= totalActivationSteps) {
        setPhase('pooling');
        return;
      }
      
      const row = Math.floor(activationStep / convOutputSize);
      const col = activationStep % convOutputSize;
      
      // Apply activation to this cell
      const rawValue = featureMap[row]?.[col];
      let activatedValue: number | null = null;
      
      if (rawValue !== null) {
        switch (activationType) {
          case 'none':
            activatedValue = rawValue;
            break;
          case 'relu':
            activatedValue = applyReLU(rawValue);
            break;
          case 'sigmoid':
            activatedValue = applySigmoid(rawValue);
            break;
          case 'softmax':
            // For softmax, we need all values - compute incrementally
            activatedValue = activatedFeatureMap[row]?.[col] ?? rawValue;
            break;
          default:
            activatedValue = rawValue;
        }
      }
      
      setDisplayedActivationMap(prev => {
        const newMap = prev.length === 0 
          ? Array(convOutputSize).fill(null).map(() => Array(convOutputSize).fill(null))
          : prev.map(r => [...r]);
        newMap[row][col] = activatedValue;
        return newMap;
      });
      
      setActivationStep(prev => prev + 1);
      
      // Check if activation is complete
      if (activationStep + 1 >= totalActivationSteps) {
        setPhase('pooling');
      }
    } else {
      // Handle Global Average Pooling separately - it's a single step
      if (poolingType === 'globalAverage') {
        if (poolStep >= 1) {
          setIsPlaying(false);
          return;
        }
        
        // Use poolingInputMap (activated or raw based on poolingSource setting)
        const inputMap = poolingInputMap.length > 0 ? poolingInputMap : 
          Array(convOutputSize).fill(null).map((_, r) => 
            Array(convOutputSize).fill(null).map((_, c) => performConvolution(r, c).sum)
          );
        
        const globalAvg = performGlobalAveragePooling(inputMap);
        
        // Create a special pooling step for global average
        const stepResult: PoolingStep = {
          window: inputMap, // The entire feature map is the window
          maxValue: Math.max(...inputMap.flat()),
          minValue: Math.min(...inputMap.flat()),
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
      
      // Use poolingInputMap (activated or raw based on poolingSource setting)
      const inputMap = poolingInputMap.length > 0 ? poolingInputMap : 
        Array(convOutputSize).fill(null).map((_, r) => 
          Array(convOutputSize).fill(null).map((_, c) => performConvolution(r, c).sum)
        );
      
      const stepResult = performPooling(row, col, inputMap, poolingType);
      
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
        setIsPoolingPlaying(false);
      }
    }
  }, [phase, convStep, poolStep, activationStep, totalConvSteps, totalPoolSteps, totalActivationSteps, 
      convOutputSize, poolOutputSize, performConvolution, performPooling, performGlobalAveragePooling, 
      poolingInputMap, poolingType, featureMap, activationType, applyReLU, applySigmoid, activatedFeatureMap]);

  // NEW: Step through activation only (for dedicated activation controls)
  const stepActivation = useCallback(() => {
    if (phase !== 'activation') return;
    
    if (activationStep >= totalActivationSteps) {
      setIsActivationPlaying(false);
      setPhase('pooling');
      return;
    }
    
    const row = Math.floor(activationStep / convOutputSize);
    const col = activationStep % convOutputSize;
    
    // Apply activation to this cell
    const rawValue = featureMap[row]?.[col];
    let activatedValue: number | null = null;
    
    if (rawValue !== null) {
      switch (activationType) {
        case 'none':
          activatedValue = rawValue;
          break;
        case 'relu':
          activatedValue = applyReLU(rawValue);
          break;
        case 'sigmoid':
          activatedValue = applySigmoid(rawValue);
          break;
        case 'softmax':
          // For softmax, use pre-computed value
          activatedValue = activatedFeatureMap[row]?.[col] ?? rawValue;
          break;
        default:
          activatedValue = rawValue;
      }
    }
    
    setDisplayedActivationMap(prev => {
      const newMap = prev.length === 0 
        ? Array(convOutputSize).fill(null).map(() => Array(convOutputSize).fill(null))
        : prev.map(r => [...r]);
      newMap[row][col] = activatedValue;
      return newMap;
    });
    
    setActivationStep(prev => prev + 1);
    
    if (activationStep + 1 >= totalActivationSteps) {
      setIsActivationPlaying(false);
      setPhase('pooling');
    }
  }, [phase, activationStep, totalActivationSteps, convOutputSize, featureMap, 
      activationType, applyReLU, applySigmoid, activatedFeatureMap]);

  // NEW: Toggle activation play/pause
  const toggleActivationPlay = useCallback(() => {
    if (isActivationPlaying) {
      setIsActivationPlaying(false);
      if (activationIntervalRef.current) {
        clearInterval(activationIntervalRef.current);
        activationIntervalRef.current = null;
      }
    } else {
      setIsActivationPlaying(true);
    }
  }, [isActivationPlaying]);

  // Auto-step activation when activation is playing
  useEffect(() => {
    if (isActivationPlaying && phase === 'activation') {
      activationIntervalRef.current = setInterval(() => {
        stepActivation();
      }, 50);
    }
    
    return () => {
      if (activationIntervalRef.current) {
        clearInterval(activationIntervalRef.current);
      }
    };
  }, [isActivationPlaying, stepActivation, phase]);

  // NEW: Step through pooling only (for dedicated pooling controls)
  const stepPooling = useCallback(() => {
    if (phase !== 'pooling') return;
    
    // Handle Global Average Pooling separately - it's a single step
    if (poolingType === 'globalAverage') {
      if (poolStep >= 1) {
        setIsPoolingPlaying(false);
        return;
      }
      
      // Use poolingInputMap (activated or raw based on poolingSource setting)
      const inputMap = poolingInputMap.length > 0 ? poolingInputMap : 
        Array(convOutputSize).fill(null).map((_, r) => 
          Array(convOutputSize).fill(null).map((_, c) => performConvolution(r, c).sum)
        );
      
      const globalAvg = performGlobalAveragePooling(inputMap);
      
      // Create a special pooling step for global average
      const stepResult: PoolingStep = {
        window: inputMap,
        maxValue: Math.max(...inputMap.flat()),
        minValue: Math.min(...inputMap.flat()),
        avgValue: globalAvg,
        resultValue: globalAvg,
        row: 0,
        col: 0,
        poolingType: 'globalAverage',
      };
      
      setCurrentPoolStep(stepResult);
      setPooledMap([[globalAvg]]);
      setPoolStep(1);
      setIsPoolingPlaying(false);
      return;
    }
    
    // Standard pooling (max, min, average)
    if (poolStep >= totalPoolSteps) {
      setIsPoolingPlaying(false);
      return;
    }
    
    const row = Math.floor(poolStep / poolOutputSize);
    const col = poolStep % poolOutputSize;
    
    // Use poolingInputMap (activated or raw based on poolingSource setting)
    const inputMap = poolingInputMap.length > 0 ? poolingInputMap : 
      Array(convOutputSize).fill(null).map((_, r) => 
        Array(convOutputSize).fill(null).map((_, c) => performConvolution(r, c).sum)
      );
    
    const stepResult = performPooling(row, col, inputMap, poolingType);
    
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
      setIsPoolingPlaying(false);
    }
  }, [phase, poolStep, totalPoolSteps, poolOutputSize, convOutputSize, 
      performConvolution, performPooling, performGlobalAveragePooling, poolingInputMap, poolingType]);

  // NEW: Toggle pooling play/pause (dedicated for pooling section)
  const togglePoolingPlay = useCallback(() => {
    if (isPoolingPlaying) {
      setIsPoolingPlaying(false);
      if (poolingIntervalRef.current) {
        clearInterval(poolingIntervalRef.current);
        poolingIntervalRef.current = null;
      }
    } else {
      setIsPoolingPlaying(true);
    }
  }, [isPoolingPlaying]);

  // Auto-step pooling when pooling is playing
  useEffect(() => {
    if (isPoolingPlaying && phase === 'pooling') {
      poolingIntervalRef.current = setInterval(() => {
        stepPooling();
      }, 50);
    }
    
    return () => {
      if (poolingIntervalRef.current) {
        clearInterval(poolingIntervalRef.current);
      }
    };
  }, [isPoolingPlaying, stepPooling, phase]);

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

  // Check if pooling is complete (for dedicated pooling controls)
  const isPoolingComplete = poolingType === 'globalAverage' ? poolStep >= 1 : poolStep >= totalPoolSteps;

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
    
    // NEW: Activation function state
    activationType,
    setActivationType,
    activatedFeatureMap,
    displayedActivationMap,
    activationStep,
    totalActivationSteps,
    
    // NEW: Dedicated activation controls
    isActivationPlaying,
    isActivationComplete: activationStep >= totalActivationSteps,
    stepActivation,
    toggleActivationPlay,
    resetActivation,
    
    // NEW: Pooling source state
    poolingSource,
    setPoolingSource,
    poolingInputMap,
    
    // NEW: Dedicated pooling controls
    isPoolingPlaying,
    isPoolingComplete,
    stepPooling,
    togglePoolingPlay,
    resetPooling,
    
    // Actions
    setSelectedClass,
    setFilterType,
    step,
    togglePlay,
    reset,
  };
}
