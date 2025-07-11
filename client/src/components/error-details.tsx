import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { AlertCircle, ChevronDown, Copy, ExternalLink, Bug } from "lucide-react";
import { useState } from "react";
import type { TestCase } from "@shared/schema";

interface ErrorDetailsProps {
  testCases: TestCase[];
}

interface ErrorDetail {
  testCaseId: number;
  testName: string;
  framework: string;
  errorType: string;
  message: string;
  stackTrace?: string;
  expectedResult?: string;
  actualResult?: string;
  screenshot?: string;
  reproduction?: string[];
  severity: 'critical' | 'high' | 'medium' | 'low';
  category: 'functional' | 'security' | 'performance' | 'ui' | 'api' | 'accessibility';
}

export default function ErrorDetails({ testCases }: ErrorDetailsProps) {
  const [expandedErrors, setExpandedErrors] = useState<Set<number>>(new Set());

  // Extract detailed error information from failed test cases
  const errorDetails: ErrorDetail[] = testCases
    .filter(tc => tc.status === 'failed' || (tc.results && !(tc.results as any).passed))
    .map(tc => ({
      testCaseId: tc.id,
      testName: tc.name,
      framework: tc.generatedBy || 'unknown',
      errorType: getErrorType(tc),
      message: getErrorMessage(tc),
      stackTrace: getStackTrace(tc),
      expectedResult: getExpectedResult(tc),
      actualResult: getActualResult(tc),
      screenshot: getScreenshot(tc),
      reproduction: getReproductionSteps(tc),
      severity: getErrorSeverity(tc),
      category: getErrorCategory(tc)
    }));

  const toggleError = (testCaseId: number) => {
    const newExpanded = new Set(expandedErrors);
    if (newExpanded.has(testCaseId)) {
      newExpanded.delete(testCaseId);
    } else {
      newExpanded.add(testCaseId);
    }
    setExpandedErrors(newExpanded);
  };

  const copyErrorDetails = (error: ErrorDetail) => {
    const errorText = `
Test: ${error.testName}
Framework: ${error.framework}
Error Type: ${error.errorType}
Message: ${error.message}
Expected: ${error.expectedResult || 'N/A'}
Actual: ${error.actualResult || 'N/A'}
Stack Trace: ${error.stackTrace || 'N/A'}
Reproduction Steps: ${error.reproduction?.join('\n') || 'N/A'}
    `.trim();
    
    navigator.clipboard.writeText(errorText);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'security':
        return '🔒';
      case 'performance':
        return '⚡';
      case 'ui':
        return '🎨';
      case 'api':
        return '🔗';
      case 'accessibility':
        return '♿';
      default:
        return '🐛';
    }
  };

  if (errorDetails.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <div className="text-green-600 mb-2">
            ✅ No test failures detected
          </div>
          <p className="text-sm text-gray-600">
            All tests are passing successfully!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-carbon-gray-100 flex items-center">
            <AlertCircle className="mr-2 text-red-600" size={20} />
            Error Analysis ({errorDetails.length} issues)
          </h3>
          <div className="flex items-center space-x-2">
            <Badge variant="destructive">
              {errorDetails.filter(e => e.severity === 'critical').length} Critical
            </Badge>
            <Badge variant="secondary">
              {errorDetails.filter(e => e.severity === 'high').length} High
            </Badge>
          </div>
        </div>

        <div className="space-y-4">
          {errorDetails.map((error) => (
            <Collapsible
              key={error.testCaseId}
              open={expandedErrors.has(error.testCaseId)}
              onOpenChange={() => toggleError(error.testCaseId)}
            >
              <div className={`border rounded-lg p-4 ${getSeverityColor(error.severity)}`}>
                <CollapsibleTrigger className="w-full">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="text-lg">{getCategoryIcon(error.category)}</span>
                      <div className="text-left">
                        <h4 className="font-medium">{error.testName}</h4>
                        <p className="text-sm opacity-80">{error.errorType}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" className="text-xs">
                        {error.framework}
                      </Badge>
                      <Badge className={`text-xs ${getSeverityColor(error.severity)}`}>
                        {error.severity}
                      </Badge>
                      <ChevronDown
                        className={`transition-transform ${
                          expandedErrors.has(error.testCaseId) ? 'rotate-180' : ''
                        }`}
                        size={16}
                      />
                    </div>
                  </div>
                </CollapsibleTrigger>

                <CollapsibleContent className="mt-4">
                  <div className="space-y-4 bg-white/50 p-4 rounded-lg">
                    {/* Error Message */}
                    <div>
                      <h5 className="font-medium text-sm mb-2">Error Message</h5>
                      <p className="text-sm bg-red-50 p-3 rounded border-l-4 border-red-400">
                        {error.message}
                      </p>
                    </div>

                    {/* Expected vs Actual */}
                    {(error.expectedResult || error.actualResult) && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {error.expectedResult && (
                          <div>
                            <h5 className="font-medium text-sm mb-2 text-green-700">Expected Result</h5>
                            <pre className="text-xs bg-green-50 p-3 rounded border overflow-x-auto">
                              {error.expectedResult}
                            </pre>
                          </div>
                        )}
                        {error.actualResult && (
                          <div>
                            <h5 className="font-medium text-sm mb-2 text-red-700">Actual Result</h5>
                            <pre className="text-xs bg-red-50 p-3 rounded border overflow-x-auto">
                              {error.actualResult}
                            </pre>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Stack Trace */}
                    {error.stackTrace && (
                      <div>
                        <h5 className="font-medium text-sm mb-2">Stack Trace</h5>
                        <pre className="text-xs bg-gray-100 p-3 rounded border overflow-x-auto max-h-40">
                          {error.stackTrace}
                        </pre>
                      </div>
                    )}

                    {/* Reproduction Steps */}
                    {error.reproduction && error.reproduction.length > 0 && (
                      <div>
                        <h5 className="font-medium text-sm mb-2">Reproduction Steps</h5>
                        <ol className="text-sm space-y-1">
                          {error.reproduction.map((step, index) => (
                            <li key={index} className="flex items-start">
                              <span className="bg-blue-100 text-blue-800 text-xs rounded-full w-5 h-5 flex items-center justify-center mr-2 mt-0.5">
                                {index + 1}
                              </span>
                              {step}
                            </li>
                          ))}
                        </ol>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center space-x-2 pt-2 border-t">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyErrorDetails(error)}
                        className="text-xs"
                      >
                        <Copy size={12} className="mr-1" />
                        Copy Details
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs"
                        onClick={() => window.open(`/test-case/${error.testCaseId}`, '_blank')}
                      >
                        <ExternalLink size={12} className="mr-1" />
                        View Test
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs"
                      >
                        <Bug size={12} className="mr-1" />
                        Create Issue
                      </Button>
                    </div>
                  </div>
                </CollapsibleContent>
              </div>
            </Collapsible>
          ))}
        </div>

        {/* Summary */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium mb-3">Error Summary</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="font-medium text-red-600">Critical:</span>
              <span className="ml-2">{errorDetails.filter(e => e.severity === 'critical').length}</span>
            </div>
            <div>
              <span className="font-medium text-orange-600">High:</span>
              <span className="ml-2">{errorDetails.filter(e => e.severity === 'high').length}</span>
            </div>
            <div>
              <span className="font-medium text-yellow-600">Medium:</span>
              <span className="ml-2">{errorDetails.filter(e => e.severity === 'medium').length}</span>
            </div>
            <div>
              <span className="font-medium text-blue-600">Low:</span>
              <span className="ml-2">{errorDetails.filter(e => e.severity === 'low').length}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Helper functions to extract error details from test case results
function getErrorType(testCase: TestCase): string {
  const results = testCase.results as any;
  if (results?.error?.type) return results.error.type;
  if (results?.errorType) return results.errorType;
  if (testCase.type === 'security') return 'Security Vulnerability';
  if (testCase.type === 'performance') return 'Performance Issue';
  if (testCase.type === 'accessibility') return 'Accessibility Violation';
  return 'Test Failure';
}

function getErrorMessage(testCase: TestCase): string {
  const results = testCase.results as any;
  if (results?.error?.message) return results.error.message;
  if (results?.message && !results.passed) return results.message;
  return `Test "${testCase.name}" failed to meet expected criteria`;
}

function getStackTrace(testCase: TestCase): string | undefined {
  const results = testCase.results as any;
  return results?.error?.stackTrace || results?.stackTrace;
}

function getExpectedResult(testCase: TestCase): string | undefined {
  const results = testCase.results as any;
  return results?.expected || results?.expectedResult;
}

function getActualResult(testCase: TestCase): string | undefined {
  const results = testCase.results as any;
  return results?.actual || results?.actualResult;
}

function getScreenshot(testCase: TestCase): string | undefined {
  const results = testCase.results as any;
  return results?.screenshot;
}

function getReproductionSteps(testCase: TestCase): string[] {
  const results = testCase.results as any;
  if (results?.reproductionSteps) return results.reproductionSteps;
  
  // Generate based on test type
  const baseSteps = [
    "Navigate to the application",
    "Execute the test scenario"
  ];
  
  if (testCase.type === 'e2e') {
    return [
      ...baseSteps,
      "Complete the end-to-end user workflow",
      "Verify the expected outcome"
    ];
  }
  
  if (testCase.type === 'security') {
    return [
      ...baseSteps,
      "Attempt security test scenario",
      "Check for vulnerabilities"
    ];
  }
  
  return baseSteps;
}

function getErrorSeverity(testCase: TestCase): 'critical' | 'high' | 'medium' | 'low' {
  if (testCase.priority === 'high' && testCase.type === 'security') return 'critical';
  if (testCase.priority === 'high') return 'high';
  if (testCase.priority === 'medium') return 'medium';
  return 'low';
}

function getErrorCategory(testCase: TestCase): 'functional' | 'security' | 'performance' | 'ui' | 'api' | 'accessibility' {
  if (testCase.type === 'security') return 'security';
  if (testCase.type === 'performance') return 'performance';
  if (testCase.type === 'accessibility') return 'accessibility';
  if (testCase.type === 'api') return 'api';
  if (testCase.type === 'visual') return 'ui';
  return 'functional';
}