import React, { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Play, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import { useTestGeneration, TestResult } from '@/hooks/useTestGeneration';
import type { Project } from '@shared/schema';

interface TestGenerationProps {
  project: Project;
  onScriptGenerated?: (scriptContent: string) => void;
  onTestsRun?: (results: TestResult[]) => void;
  onResultsView?: (results: TestResult[]) => void;
}

export const EnhancedTestGenerationFixed: React.FC<TestGenerationProps> = ({
  project,
  onScriptGenerated,
  onTestsRun,
  onResultsView
}) => {
  // Use the custom hook for state management
  const [testState, testActions] = useTestGeneration({
    projectId: project?.id?.toString(),
    onScriptGenerated,
    onTestsRun,
    onResultsView,
    apiEndpoint: '/api/test-generation'
  });

  // Reset state when project changes
  useEffect(() => {
    if (project?.id) {
      testActions.reset();
    }
  }, [project?.id, testActions]);

  const getButtonVariant = (isActive: boolean, isLoading: boolean) => {
    if (isLoading) return 'default';
    if (isActive) return 'default';
    return 'secondary';
  };

  const getStatusBadge = (completed: boolean, isLoading: boolean) => {
    if (isLoading) return <Badge variant="secondary">In Progress</Badge>;
    if (completed) return <Badge variant="default">Completed</Badge>;
    return <Badge variant="outline">Pending</Badge>;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Enhanced Test Generation</CardTitle>
          <CardDescription>
            Generate, run, and view automated tests for your project
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Error Display */}
          {testState.error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center">
                <AlertCircle className="h-4 w-4 text-red-600 mr-2" />
                <span className="text-red-800 text-sm">{testState.error}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={testActions.clearError}
                  className="ml-auto text-red-600 hover:text-red-800"
                >
                  ×
                </Button>
              </div>
            </div>
          )}

          {/* Progress Display */}
          {(testState.isGenerating || testState.isRunning || testState.isViewing) && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{testState.currentStep}</span>
                <span className="text-sm text-muted-foreground">
                  {Math.round(testState.progress)}%
                </span>
              </div>
              <Progress value={testState.progress} className="h-2" />
            </div>
          )}

          {/* Action Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Generate Scripts Button */}
            <div className="space-y-2">
              <Button
                onClick={testActions.generateScripts}
                disabled={testState.isGenerating || !project?.id}
                variant={getButtonVariant(testState.scriptsGenerated, testState.isGenerating)}
                className="w-full"
                data-testid="generate-scripts"
              >
                {testState.isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <FileText className="mr-2 h-4 w-4" />
                    Generate Scripts
                  </>
                )}
              </Button>
              {getStatusBadge(testState.scriptsGenerated, testState.isGenerating)}
            </div>

            {/* Run Tests Button */}
            <div className="space-y-2">
              <Button
                onClick={testActions.runTests}
                disabled={!testState.scriptsGenerated || testState.isRunning}
                variant={getButtonVariant(testState.testsRun, testState.isRunning)}
                className="w-full"
                data-testid="run-tests"
              >
                {testState.isRunning ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Running...
                  </>
                ) : (
                  <>
                    <Play className="mr-2 h-4 w-4" />
                    Run Tests
                  </>
                )}
              </Button>
              {getStatusBadge(testState.testsRun, testState.isRunning)}
            </div>

            {/* View Results Button */}
            <div className="space-y-2">
              <Button
                onClick={testActions.viewResults}
                disabled={!testState.testsRun || testState.results.length === 0 || testState.isViewing}
                variant={getButtonVariant(testState.results.length > 0, testState.isViewing)}
                className="w-full"
                data-testid="view-results"
              >
                {testState.isViewing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    View Results
                  </>
                )}
              </Button>
              {getStatusBadge(testState.results.length > 0, testState.isViewing)}
            </div>
          </div>

          {/* Flow Status */}
          <div className="mt-6 p-4 bg-muted rounded-lg">
            <h3 className="font-semibold mb-2">Flow Progress</h3>
            <div className="flex items-center space-x-4 text-sm">
              <div className="flex items-center">
                {testState.scriptsGenerated ? (
                  <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-yellow-500 mr-1" />
                )}
                Scripts Generated
              </div>
              <div className="flex items-center">
                {testState.testsRun ? (
                  <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-yellow-500 mr-1" />
                )}
                Tests Executed
              </div>
              <div className="flex items-center">
                {testState.results.length > 0 ? (
                  <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-yellow-500 mr-1" />
                )}
                Results Available
              </div>
            </div>
          </div>

          {/* Results Summary */}
          {testState.results.length > 0 && (
            <div className="mt-4 p-4 bg-muted rounded-lg">
              <h3 className="font-semibold mb-2">Test Results Summary</h3>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="font-medium">Total:</span> {testState.results.length}
                </div>
                <div>
                  <span className="font-medium text-green-600">Passed:</span>{' '}
                  {testState.results.filter(r => r.status === 'passed').length}
                </div>
                <div>
                  <span className="font-medium text-red-600">Failed:</span>{' '}
                  {testState.results.filter(r => r.status === 'failed').length}
                </div>
              </div>
            </div>
          )}

          {/* Debug Information (can be removed in production) */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Debug Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm space-y-1">
                <div>Scripts Generated: {testState.scriptsGenerated ? 'Yes' : 'No'}</div>
                <div>Tests Run: {testState.testsRun ? 'Yes' : 'No'}</div>
                <div>Results Available: {testState.results.length > 0 ? 'Yes' : 'No'}</div>
                <div>Current Operation: {
                  testState.isGenerating ? 'Generating' :
                  testState.isRunning ? 'Running' :
                  testState.isViewing ? 'Viewing' : 'None'
                }</div>
                <div>Current Step: {testState.currentStep || 'Waiting for action...'}</div>
                <div>Progress: {testState.progress}%</div>
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
};

export default EnhancedTestGenerationFixed;