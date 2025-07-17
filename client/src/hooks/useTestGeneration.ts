import { useState, useCallback, useRef } from 'react';

export interface TestResult {
  id: string;
  name: string;
  status: 'passed' | 'failed' | 'pending';
  duration: number;
  error?: string;
}

export interface TestGenerationState {
  isGenerating: boolean;
  isRunning: boolean;
  isViewing: boolean;
  progress: number;
  currentStep: string;
  scriptsGenerated: boolean;
  testsRun: boolean;
  results: TestResult[];
  error?: string;
}

export interface TestGenerationActions {
  generateScripts: () => Promise<void>;
  runTests: () => Promise<void>;
  viewResults: () => Promise<void>;
  reset: () => void;
  setError: (error: string) => void;
  clearError: () => void;
}

export interface UseTestGenerationProps {
  projectId?: string;
  onScriptGenerated?: (scriptContent: string) => void;
  onTestsRun?: (results: TestResult[]) => void;
  onResultsView?: (results: TestResult[]) => void;
  apiEndpoint?: string;
}

export const useTestGeneration = ({
  projectId,
  onScriptGenerated,
  onTestsRun,
  onResultsView,
  apiEndpoint = '/api/test-generation'
}: UseTestGenerationProps): [TestGenerationState, TestGenerationActions] => {
  const [state, setState] = useState<TestGenerationState>({
    isGenerating: false,
    isRunning: false,
    isViewing: false,
    progress: 0,
    currentStep: '',
    scriptsGenerated: false,
    testsRun: false,
    results: [],
    error: undefined
  });

  const abortControllerRef = useRef<AbortController | null>(null);

  const updateProgress = useCallback((progress: number, step: string) => {
    setState(prev => ({
      ...prev,
      progress,
      currentStep: step
    }));
  }, []);

  const generateScripts = useCallback(async () => {
    if (!projectId) {
      setState(prev => ({ ...prev, error: 'Project ID is required for script generation' }));
      return;
    }

    // Cancel any existing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();

    setState(prev => ({
      ...prev,
      isGenerating: true,
      progress: 0,
      currentStep: 'Initializing script generation...',
      error: undefined
    }));

    try {
      const steps = [
        'Analyzing project structure...',
        'Identifying test scenarios...',
        'Generating test scripts...',
        'Validating generated scripts...',
        'Finalizing test suite...'
      ];

      // If you have a real API endpoint, replace this with actual API call
      const response = await fetch(`${apiEndpoint}/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ projectId }),
        signal: abortControllerRef.current.signal
      });

      if (!response.ok) {
        throw new Error(`Failed to generate scripts: ${response.statusText}`);
      }

      // Simulate progress for now - replace with actual progress tracking
      for (let i = 0; i < steps.length; i++) {
        updateProgress(((i + 1) / steps.length) * 100, steps[i]);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      const result = await response.json();
      
      setState(prev => ({
        ...prev,
        isGenerating: false,
        scriptsGenerated: true,
        currentStep: 'Scripts generated successfully!',
        progress: 100
      }));

      onScriptGenerated?.(result.scriptContent || 'Generated scripts content');
      
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        setState(prev => ({
          ...prev,
          isGenerating: false,
          currentStep: 'Script generation cancelled'
        }));
      } else {
        setState(prev => ({
          ...prev,
          isGenerating: false,
          error: error instanceof Error ? error.message : 'Unknown error occurred',
          currentStep: 'Error generating scripts'
        }));
      }
    }
  }, [projectId, onScriptGenerated, apiEndpoint, updateProgress]);

  const runTests = useCallback(async () => {
    if (!state.scriptsGenerated) {
      setState(prev => ({ ...prev, error: 'Scripts must be generated before running tests' }));
      return;
    }

    // Cancel any existing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();

    setState(prev => ({
      ...prev,
      isRunning: true,
      progress: 0,
      currentStep: 'Preparing test environment...',
      error: undefined
    }));

    try {
      const steps = [
        'Preparing test environment...',
        'Executing test scripts...',
        'Running integration tests...',
        'Collecting results...',
        'Generating test report...'
      ];

      const response = await fetch(`${apiEndpoint}/run`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ projectId }),
        signal: abortControllerRef.current.signal
      });

      if (!response.ok) {
        throw new Error(`Failed to run tests: ${response.statusText}`);
      }

      // Simulate progress for now - replace with actual progress tracking
      for (let i = 0; i < steps.length; i++) {
        updateProgress(((i + 1) / steps.length) * 100, steps[i]);
        await new Promise(resolve => setTimeout(resolve, 1500));
      }

      const result = await response.json();
      
      setState(prev => ({
        ...prev,
        isRunning: false,
        testsRun: true,
        results: result.results || [],
        currentStep: 'Tests completed successfully!',
        progress: 100
      }));

      onTestsRun?.(result.results || []);
      
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        setState(prev => ({
          ...prev,
          isRunning: false,
          currentStep: 'Test execution cancelled'
        }));
      } else {
        setState(prev => ({
          ...prev,
          isRunning: false,
          error: error instanceof Error ? error.message : 'Unknown error occurred',
          currentStep: 'Error running tests'
        }));
      }
    }
  }, [state.scriptsGenerated, projectId, onTestsRun, apiEndpoint, updateProgress]);

  const viewResults = useCallback(async () => {
    if (!state.testsRun || state.results.length === 0) {
      setState(prev => ({ ...prev, error: 'Tests must be run before viewing results' }));
      return;
    }

    setState(prev => ({
      ...prev,
      isViewing: true,
      currentStep: 'Loading test results...',
      error: undefined
    }));

    try {
      // Simulate loading delay - replace with actual API call if needed
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setState(prev => ({
        ...prev,
        isViewing: false,
        currentStep: 'Results loaded successfully!'
      }));

      onResultsView?.(state.results);
      
    } catch (error) {
      setState(prev => ({
        ...prev,
        isViewing: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        currentStep: 'Error loading results'
      }));
    }
  }, [state.testsRun, state.results, onResultsView]);

  const reset = useCallback(() => {
    // Cancel any ongoing requests
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    setState({
      isGenerating: false,
      isRunning: false,
      isViewing: false,
      progress: 0,
      currentStep: '',
      scriptsGenerated: false,
      testsRun: false,
      results: [],
      error: undefined
    });
  }, []);

  const setError = useCallback((error: string) => {
    setState(prev => ({ ...prev, error }));
  }, []);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: undefined }));
  }, []);

  return [state, {
    generateScripts,
    runTests,
    viewResults,
    reset,
    setError,
    clearError
  }];
};