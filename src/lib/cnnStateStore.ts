/**
 * Global CNN Pipeline State Store
 * 
 * This module provides persistent state management for the CNN visualization
 * across page navigation. State is stored in sessionStorage and synced with
 * an in-memory cache for performance.
 * 
 * The store persists:
 * - Configuration (dataset, class, filter, padding, stride)
 * - Computed outputs (feature map, activation map, pooled map, flattened vector)
 * - Dense layer outputs (logits, softmax)
 * - Phase completion status
 */

import { FilterType, DatasetType } from '@/data/datasets';
import { PoolingType, ActivationType, PoolingSourceType, FlattenSourceType, DenseActivationType, ConvolutionStep, PoolingStep } from '@/hooks/useCNNVisualization';

// ============================================
// Type Definitions
// ============================================

export interface CNNPipelineState {
  // Configuration
  dataset: DatasetType;
  selectedClass: number;
  filterType: FilterType;
  padding: number;
  stride: number;
  
  // Activation settings
  activationType: ActivationType;
  poolingSource: PoolingSourceType;
  poolingType: PoolingType;
  
  // Flatten settings
  flattenSource: FlattenSourceType;
  
  // Dense settings
  denseLayerSize: number;
  selectedNeuron: number;
  denseActivationType: DenseActivationType;
  showTopK: boolean;
  
  // Computed outputs
  featureMap: number[][];
  displayedActivationMap: (number | null)[][];
  pooledMap: number[][];
  flattenedVector: number[];
  
  // Dense layer computed values
  denseWeights: number[][];
  denseBiases: number[];
  denseNeuronOutputs: (number | null)[];
  denseActivatedOutputs: (number | null)[];
  
  // Progress tracking
  convStep: number;
  activationStep: number;
  poolStep: number;
  flattenStep: number;
  denseStep: number;
  denseRunningSum: number;
  
  // Phase
  phase: 'convolution' | 'activation' | 'pooling' | 'flatten' | 'dense';
  
  // Current steps (for visualization)
  currentConvStep: ConvolutionStep | null;
  currentPoolStep: PoolingStep | null;
  
  // Version for cache invalidation
  version: number;
}

// ============================================
// Default State
// ============================================

const DEFAULT_STATE: CNNPipelineState = {
  // Configuration
  dataset: 'mnist',
  selectedClass: 7,
  filterType: 'topEdge',
  padding: 0,
  stride: 1,
  
  // Activation settings
  activationType: 'relu',
  poolingSource: 'activated',
  poolingType: 'max',
  
  // Flatten settings
  flattenSource: 'pooled',
  
  // Dense settings
  denseLayerSize: 10,
  selectedNeuron: 0,
  denseActivationType: 'none',
  showTopK: false,
  
  // Computed outputs - initially empty
  featureMap: [],
  displayedActivationMap: [],
  pooledMap: [],
  flattenedVector: [],
  
  // Dense layer values
  denseWeights: [],
  denseBiases: [],
  denseNeuronOutputs: [],
  denseActivatedOutputs: [],
  
  // Progress tracking
  convStep: 0,
  activationStep: 0,
  poolStep: 0,
  flattenStep: 0,
  denseStep: 0,
  denseRunningSum: 0,
  
  // Phase
  phase: 'convolution',
  
  // Current steps
  currentConvStep: null,
  currentPoolStep: null,
  
  // Version
  version: 1,
};

// ============================================
// Storage Key
// ============================================

const STORAGE_KEY = 'cnn_pipeline_state';

// ============================================
// In-Memory Cache
// ============================================

let memoryCache: CNNPipelineState | null = null;
let subscribers: Array<(state: CNNPipelineState) => void> = [];

// ============================================
// Store Implementation
// ============================================

/**
 * Load state from sessionStorage
 */
function loadFromStorage(): CNNPipelineState {
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as CNNPipelineState;
      // Validate version - reset if schema changed
      if (parsed.version === DEFAULT_STATE.version) {
        return parsed;
      }
    }
  } catch (error) {
    console.warn('Failed to load CNN state from storage:', error);
  }
  return { ...DEFAULT_STATE };
}

/**
 * Save state to sessionStorage
 */
function saveToStorage(state: CNNPipelineState): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.warn('Failed to save CNN state to storage:', error);
  }
}

/**
 * Get the current state (from memory cache or storage)
 */
export function getCNNState(): CNNPipelineState {
  if (memoryCache === null) {
    memoryCache = loadFromStorage();
  }
  return memoryCache;
}

/**
 * Update the state (partial update)
 */
export function updateCNNState(updates: Partial<CNNPipelineState>): void {
  const currentState = getCNNState();
  const newState = { ...currentState, ...updates };
  memoryCache = newState;
  saveToStorage(newState);
  
  // Notify subscribers
  subscribers.forEach(callback => callback(newState));
}

/**
 * Reset the entire state
 */
export function resetCNNState(): void {
  memoryCache = { ...DEFAULT_STATE };
  saveToStorage(memoryCache);
  
  // Notify subscribers
  subscribers.forEach(callback => callback(memoryCache!));
}

/**
 * Reset configuration-dependent outputs (when config changes)
 * Keeps configuration, resets all computed outputs
 */
export function resetComputedOutputs(): void {
  const currentState = getCNNState();
  const resetState: CNNPipelineState = {
    ...currentState,
    // Reset computed outputs
    featureMap: [],
    displayedActivationMap: [],
    pooledMap: [],
    flattenedVector: [],
    denseWeights: [],
    denseBiases: [],
    denseNeuronOutputs: [],
    denseActivatedOutputs: [],
    // Reset progress
    convStep: 0,
    activationStep: 0,
    poolStep: 0,
    flattenStep: 0,
    denseStep: 0,
    denseRunningSum: 0,
    // Reset phase
    phase: 'convolution',
    currentConvStep: null,
    currentPoolStep: null,
  };
  memoryCache = resetState;
  saveToStorage(resetState);
  
  // Notify subscribers
  subscribers.forEach(callback => callback(resetState));
}

/**
 * Subscribe to state changes
 */
export function subscribeToCNNState(callback: (state: CNNPipelineState) => void): () => void {
  subscribers.push(callback);
  // Return unsubscribe function
  return () => {
    subscribers = subscribers.filter(cb => cb !== callback);
  };
}

// ============================================
// Convenience Getters for Stage Completion
// ============================================

export function isConvolutionComplete(): boolean {
  const state = getCNNState();
  // Convolution is complete if we have a full feature map
  const expectedSize = Math.floor((28 - 3 + 2 * state.padding) / state.stride) + 1;
  const totalSteps = expectedSize * expectedSize;
  return state.convStep >= totalSteps && state.featureMap.length > 0;
}

export function isActivationComplete(): boolean {
  const state = getCNNState();
  const expectedSize = Math.floor((28 - 3 + 2 * state.padding) / state.stride) + 1;
  const totalSteps = expectedSize * expectedSize;
  return state.activationStep >= totalSteps && state.displayedActivationMap.length > 0;
}

export function isPoolingComplete(): boolean {
  const state = getCNNState();
  const convSize = Math.floor((28 - 3 + 2 * state.padding) / state.stride) + 1;
  const poolSize = Math.floor(convSize / 2);
  const totalSteps = poolSize * poolSize;
  
  if (state.poolingType === 'globalAverage') {
    return state.poolStep >= 1;
  }
  return state.poolStep >= totalSteps && state.pooledMap.length > 0;
}

export function isFlattenComplete(): boolean {
  const state = getCNNState();
  return state.flattenedVector.length > 0 && state.flattenStep > 0;
}

export function isDenseComplete(): boolean {
  const state = getCNNState();
  return state.denseNeuronOutputs.length > 0 && state.denseNeuronOutputs.every(v => v !== null);
}

/**
 * Get the required previous stage for a given stage
 */
export function getRequiredPreviousStage(stage: string): { stage: string; isComplete: boolean } | null {
  switch (stage) {
    case 'convolution':
      return null; // No prerequisite
    case 'activation':
      return { stage: 'Convolution', isComplete: isConvolutionComplete() };
    case 'pooling':
      return { stage: 'Convolution', isComplete: isConvolutionComplete() };
    case 'flatten':
      return { stage: 'Convolution', isComplete: isConvolutionComplete() };
    case 'dense':
      return { stage: 'Flatten', isComplete: isFlattenComplete() };
    default:
      return null;
  }
}

// Export default state for reference
export { DEFAULT_STATE };
