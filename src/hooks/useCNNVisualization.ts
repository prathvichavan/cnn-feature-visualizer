import { useState, useCallback, useRef, useEffect } from 'react';
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
  
  const playIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Get input image based on selected class and dataset
  const inputImage = dataset === 'mnist' ? mnistSamples[selectedClass] : fashionMnistSamples[selectedClass];
  const filter = filters[filterType];
  
  // Output dimensions for convolution (28 - 3 + 1 = 26)
  const convOutputSize = 26;
  // Output dimensions for pooling (26 / 2 = 13)
  const poolOutputSize = 13;
  
  const totalConvSteps = convOutputSize * convOutputSize;
  const totalPoolSteps = poolOutputSize * poolOutputSize;

  // Perform single convolution at position
  const performConvolution = useCallback((row: number, col: number): ConvolutionStep => {
    const inputWindow: number[][] = [];
    const multiplications: number[][] = [];
    let sum = 0;
    
    for (let i = 0; i < 3; i++) {
      inputWindow[i] = [];
      multiplications[i] = [];
      for (let j = 0; j < 3; j++) {
        const pixelValue = inputImage[row + i][col + j];
        const filterValue = filter[i][j];
        inputWindow[i][j] = pixelValue;
        multiplications[i][j] = pixelValue * filterValue;
        sum += multiplications[i][j];
      }
    }
    
    return { inputWindow, filterWindow: filter, multiplications, sum, row, col };
  }, [inputImage, filter]);

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

  // Reset when class or filter changes
  useEffect(() => {
    reset();
  }, [selectedClass, filterType, dataset, reset]);

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
    
    // Actions
    setSelectedClass,
    setFilterType,
    step,
    togglePlay,
    reset,
  };
}
