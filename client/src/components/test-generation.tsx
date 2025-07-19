import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Play, Check, Clock, AlertCircle, Loader2, Download, Eye, Shield } from "lucide-react";
import EnterpriseTestDashboard from "./enterprise-test-dashboard";
import { HumanReviewGate } from "./human-review-gate";
import TestExecutionProgress from "./test-execution-progress";
import type { Project, TestCase } from "@shared/schema";

interface TestGenerationProps {
  project: Project;
  onTestsGenerated?: () => void;
}

export default function TestGeneration({ project, onTestsGenerated }: TestGenerationProps) {
  const [selectedFramework, setSelectedFramework] = useState("comprehensive");
  const [isReviewMode, setIsReviewMode] = useState(false);
  const [executionType, setExecutionType] = useState<'single' | 'suite'>('suite');
  const [selectedTestCase, setSelectedTestCase] = useState<TestCase | undefined>();
  const [pendingExecution, setPendingExecution] = useState<(() => void) | null>(null);
  const [executionStartTime, setExecutionStartTime] = useState<Date | null>(null);
  const [estimatedTimeRemaining, setEstimatedTimeRemaining] = useState<number | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Clean up polling interval on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Calculate estimated execution time based on test characteristics
  const calculateEstimatedExecutionTime = (tests: TestCase[]) => {
    const baseTimePerTest = {
      'unit': 15,        // 15 seconds per unit test
      'integration': 45,  // 45 seconds per integration test
      'e2e': 120,        // 2 minutes per e2e test
      'security': 60,    // 1 minute per security test
      'performance': 90  // 1.5 minutes per performance test
    };

    const totalSeconds = tests.reduce((total, test) => {
      const baseTime = baseTimePerTest[test.type as keyof typeof baseTimePerTest] || 30;
      
      // Adjust based on priority (high priority tests might be more complex)
      const priorityMultiplier = {
        'high': 1.3,
        'medium': 1.0,
        'low': 0.8
      };
      
      const multiplier = priorityMultiplier[test.priority as keyof typeof priorityMultiplier] || 1.0;
      return total + (baseTime * multiplier);
    }, 0);

    // Add overhead for test setup and teardown
    const overhead = Math.min(tests.length * 5, 60); // 5 seconds per test, max 1 minute
    
    return Math.round(totalSeconds + overhead);
  };

  // Update estimated time remaining based on progress
  useEffect(() => {
    if (!executionStartTime || !estimatedTimeRemaining) return;

    const completedTests = testCases.filter(tc => tc.status === 'passed' || tc.status === 'failed').length;
    const totalTests = testCases.length;
    
    if (totalTests > 0 && completedTests > 0) {
      const progressPercentage = completedTests / totalTests;
      const elapsedTime = (new Date().getTime() - executionStartTime.getTime()) / 1000;
      
      // Recalculate remaining time based on actual progress
      if (progressPercentage > 0.1) { // Only adjust after 10% completion
        const estimatedTotalTime = elapsedTime / progressPercentage;
        const newEstimatedRemaining = Math.max(0, estimatedTotalTime - elapsedTime);
        setEstimatedTimeRemaining(Math.round(newEstimatedRemaining));
      }
    }

    // Check if all tests are completed
    const allCompleted = totalTests > 0 && completedTests === totalTests;
    const hasRunningTests = testCases.some(tc => tc.status === 'running');
    
    if (allCompleted || !hasRunningTests) {
      setEstimatedTimeRemaining(null);
    }
  }, [testCases, executionStartTime, estimatedTimeRemaining]);

  const { data: testCases = [] } = useQuery<TestCase[]>({
    queryKey: [`/api/projects/${project.id}/test-cases`],
    queryFn: async () => {
      console.log(`Frontend: Fetching test cases for project ${project.id}`);
      const response = await fetch(`/api/projects/${project.id}/test-cases`);
      if (!response.ok) {
        throw new Error('Failed to fetch test cases');
      }
      const data = await response.json();
      console.log('Frontend: Raw test cases response:', data);
      console.log('Frontend: Test cases length:', data.length);
      return data;
    },
    refetchInterval: 10000, // Increased from 3s to 10s to reduce memory usage
    refetchIntervalInBackground: false, // Stop polling when tab is not active
  });

  const { data: analyses = [] } = useQuery({
    queryKey: ['/api/projects', project.id, 'analyses'],
  });

  const generateTestsMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/projects/${project.id}/generate-tests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          testTypes: ['unit', 'integration', 'e2e'],
          coverage: 80,
          frameworks: [selectedFramework]
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate tests');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Tests Generated Successfully",
        description: "Test cases have been generated and are ready for execution.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/projects', project.id, 'test-cases'] });
      
      // Call the callback if provided
      if (onTestsGenerated) {
        onTestsGenerated();
      }
    },
    onError: () => {
      toast({
        title: "Test Generation Failed",
        description: "Failed to generate test cases. Please try again.",
        variant: "destructive",
      });
    },
  });

  const runTestMutation = useMutation({
    mutationFn: async (testCaseId: number) => {
      const response = await apiRequest("POST", `/api/test-cases/${testCaseId}/run`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Test Started",
        description: "Test execution has begun. Results will be available shortly.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/projects', project.id, 'test-cases'] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to start test execution.",
        variant: "destructive",
      });
    },
  });

  const runTestSuiteMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/projects/${project.id}/run-test-suite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          framework: selectedFramework,
          testCaseIds: testCases.map(tc => tc.id)
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to run test suite');
      }
      
      return response.json();
    },
    onSuccess: () => {
      setExecutionStartTime(new Date());
      // Estimate execution time based on test count and type
      const estimatedSeconds = calculateEstimatedExecutionTime(testCases);
      setEstimatedTimeRemaining(estimatedSeconds);
      
      toast({
        title: "Test Suite Started",
        description: `Running ${testCases.length} test cases with ${selectedFramework}. Estimated time: ${Math.ceil(estimatedSeconds / 60)} minutes.`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/projects', project.id, 'test-cases'] });
    },
    onError: () => {
      toast({
        title: "Test Suite Failed",
        description: "Failed to start test suite execution. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Human Review handlers
  const handleRunTestWithReview = (testCaseId: number) => {
    const testCase = testCases.find(tc => tc.id === testCaseId);
    if (!testCase) return;
    
    setSelectedTestCase(testCase);
    setExecutionType('single');
    setPendingExecution(() => () => runTestMutation.mutate(testCaseId));
    setIsReviewMode(true);
  };

  const handleRunTestSuiteWithReview = () => {
    setSelectedTestCase(undefined);
    setExecutionType('suite');
    setPendingExecution(() => () => runTestSuiteMutation.mutate());
    setIsReviewMode(true);
  };

  const handleReviewApprove = () => {
    if (pendingExecution) {
      toast({
        title: "Test Execution Approved",
        description: "Human review completed. Starting test execution...",
      });
      pendingExecution();
      setIsReviewMode(false);
      setPendingExecution(null);
      setSelectedTestCase(undefined);
    }
  };

  const handleReviewReject = () => {
    toast({
      title: "Test Execution Rejected",
      description: "Test execution cancelled by human reviewer.",
      variant: "destructive",
    });
    setIsReviewMode(false);
    setPendingExecution(null);
    setSelectedTestCase(undefined);
  };

  const handleReviewClose = () => {
    setIsReviewMode(false);
    setPendingExecution(null);
    setSelectedTestCase(undefined);
  };

  // Group test cases by type
  const unitTests = testCases.filter(tc => tc.type === 'unit');
  const integrationTests = testCases.filter(tc => tc.type === 'integration');
  const e2eTests = testCases.filter(tc => tc.type === 'e2e');
  const securityTests = testCases.filter(tc => tc.type === 'security');
  const performanceTests = testCases.filter(tc => tc.type === 'performance');
  const accessibilityTests = testCases.filter(tc => tc.type === 'accessibility');
  const visualTests = testCases.filter(tc => tc.type === 'visual');
  const apiTests = testCases.filter(tc => tc.type === 'api');
  
  console.log('Test cases by type:', {
    total: testCases.length,
    unit: unitTests.length,
    integration: integrationTests.length,
    e2e: e2eTests.length,
    allTestCases: testCases.map(tc => ({ name: tc.name, type: tc.type }))
  });

  const getTestAnalysis = () => {
    return analyses.find(a => a.type === 'test_generation');
  };

  const isTestGenerationCompleted = () => {
    const testAnalysis = getTestAnalysis();
    return testAnalysis?.status === 'completed';
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-60 text-white";
      case "medium":
        return "bg-yellow-30 text-carbon-gray-100";
      default:
        return "bg-ibm-blue text-white";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "passed":
        return <Check className="text-green-50" size={14} />;
      case "running":
        return <Clock className="text-ibm-blue" size={14} />;
      case "failed":
        return <AlertCircle className="text-red-60" size={14} />;
      default:
        return <Clock className="text-carbon-gray-60" size={14} />;
    }
  };

  const getFrameworkDisplayName = (framework: string) => {
    const names = {
      comprehensive: "All Frameworks - Recommended",
      jest: "Jest",
      playwright: "Playwright", 
      cypress: "Cypress",
      selenium: "Selenium",
      k6: "k6",
      'owasp-zap': "OWASP ZAP",
      lighthouse: "Lighthouse",
      postman: "Postman"
    };
    return names[framework] || framework;
  };

  const getFrameworkDescription = (framework: string) => {
    const descriptions = {
      comprehensive: "Complete multi-dimensional testing across all frameworks for maximum coverage",
      jest: "Unit and integration testing for components and business logic",
      playwright: "End-to-end, visual regression, and accessibility testing",
      cypress: "End-to-end testing with excellent debugging capabilities",
      selenium: "Cross-browser compatibility testing",
      k6: "Performance, load, and stress testing",
      'owasp-zap': "Security vulnerability scanning and penetration testing",
      lighthouse: "Performance auditing and accessibility compliance",
      postman: "API testing, validation, and documentation"
    };
    return descriptions[framework] || "Custom framework testing";
  };

  const getFrameworkBadge = (framework: string) => {
    const frameworkColors = {
      jest: "bg-green-100 text-green-800",
      playwright: "bg-blue-100 text-blue-800", 
      cypress: "bg-teal-100 text-teal-800",
      selenium: "bg-orange-100 text-orange-800",
      k6: "bg-purple-100 text-purple-800",
      'owasp-zap': "bg-red-100 text-red-800",
      lighthouse: "bg-yellow-100 text-yellow-800",
      postman: "bg-pink-100 text-pink-800",
      comprehensive: "bg-gradient-to-r from-blue-100 to-purple-100 text-blue-800"
    };
    
    const colorClass = frameworkColors[framework] || "bg-gray-100 text-gray-800";
    
    return (
      <span className={`text-xs px-2 py-1 rounded-full ${colorClass}`}>
        {getFrameworkDisplayName(framework)}
      </span>
    );
  };

  const getTestStrategyForFramework = (framework: string) => {
    switch (framework) {
      case 'comprehensive':
        return {
          unit: { status: testCases.length > 0 ? "Generated" : "Pending", count: unitTests.length, description: "test cases for components and utilities" },
          integration: { status: testCases.length > 0 ? "Generated" : "Pending", count: integrationTests.length, description: "test cases for API endpoints" },
          e2e: { status: testCases.length > 0 ? "Generated" : "Pending", count: e2eTests.length, description: "user journey scenarios" },
          security: { status: testCases.length > 0 ? "Generated" : "Pending", count: securityTests.length, description: "security vulnerability tests" },
          performance: { status: testCases.length > 0 ? "Generated" : "Pending", count: performanceTests.length, description: "performance and load tests" },
          accessibility: { status: testCases.length > 0 ? "Generated" : "Pending", count: accessibilityTests.length, description: "accessibility compliance tests" }
        };
      case 'jest':
        return {
          unit: { status: "Ready", count: "-", description: "Unit test suite for components" },
          integration: { status: "Ready", count: "-", description: "Integration tests for services" },
          snapshot: { status: "Ready", count: "-", description: "Snapshot testing for UI" }
        };
      case 'playwright':
        return {
          e2e: { status: "Ready", count: "-", description: "End-to-end user flows" },
          visual: { status: "Ready", count: "-", description: "Visual regression testing" },
          accessibility: { status: "Ready", count: "-", description: "WCAG compliance checks" }
        };
      case 'owasp-zap':
        return {
          vulnerability: { status: "Ready", count: "-", description: "Vulnerability scanning" },
          penetration: { status: "Ready", count: "-", description: "Penetration testing" },
          compliance: { status: "Ready", count: "-", description: "Security compliance" }
        };
      case 'k6':
        return {
          load: { status: "Ready", count: "-", description: "Load testing scenarios" },
          stress: { status: "Ready", count: "-", description: "Stress testing limits" },
          performance: { status: "Ready", count: "-", description: "Performance benchmarks" }
        };
      default:
        return {
          tests: { status: "Ready", count: "-", description: `${framework} test suite` }
        };
    }
  };

  const testAnalysis = getTestAnalysis();
  const isTestGenerated = testAnalysis?.status === 'completed';
  const testStrategy = getTestStrategyForFramework(selectedFramework);

  return (
    <>
    <Card className="mb-8">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-carbon-gray-100">
            Test Generation & Automation
          </h2>
          <div className="flex items-center space-x-3">
            <Select value={selectedFramework} onValueChange={setSelectedFramework}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Select Framework" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="comprehensive">🚀 All Frameworks - Recommended</SelectItem>
                <SelectItem value="jest">Jest - Unit & Integration</SelectItem>
                <SelectItem value="playwright">Playwright - E2E & Visual</SelectItem>
                <SelectItem value="cypress">Cypress - End-to-End</SelectItem>
                <SelectItem value="selenium">Selenium - Cross-browser</SelectItem>
                <SelectItem value="k6">k6 - Performance Testing</SelectItem>
                <SelectItem value="owasp-zap">OWASP ZAP - Security</SelectItem>
                <SelectItem value="lighthouse">Lighthouse - Performance</SelectItem>
                <SelectItem value="postman">Postman - API Testing</SelectItem>
              </SelectContent>
            </Select>
            <Button 
              className="bg-ibm-blue hover:bg-blue-700"
              disabled={!isTestGenerationCompleted() || generateTestsMutation.isPending}
              onClick={() => generateTestsMutation.mutate()}
            >
              {generateTestsMutation.isPending ? (
                <>
                  <Loader2 size={16} className="mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                'Generate Tests'
              )}
            </Button>
          </div>
        </div>

        {/* Framework Selection Display */}
        {selectedFramework && (
          <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">
                  Selected Framework: {getFrameworkDisplayName(selectedFramework)}
                </h3>
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                  {getFrameworkDescription(selectedFramework)}
                </p>
              </div>
              {selectedFramework === 'comprehensive' && (
                <div className="text-xs text-blue-600 dark:text-blue-400">
                  <strong>Includes:</strong> Jest, Playwright, k6, OWASP ZAP, Lighthouse, Postman
                </div>
              )}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Test Strategy */}
          <div>
            <h3 className="text-lg font-medium text-carbon-gray-100 mb-4">
              Comprehensive Testing Strategy
            </h3>
            <div className="space-y-3">
              {Object.entries(testStrategy).map(([key, value]) => (
                <div key={key} className="p-3 bg-carbon-gray-10 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-medium text-carbon-gray-100">
                      {key.charAt(0).toUpperCase() + key.slice(1).replace('_', ' ')} Tests
                    </h4>
                    <Badge className={value.status === "Generated" ? "bg-green-50 text-white" : "bg-carbon-gray-60 text-white"}>
                      {value.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-carbon-gray-60">
                    {value.count !== "-" ? `${value.count} ` : ''}{value.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Generated Test Cases */}
          <div>
            <h3 className="text-lg font-medium text-carbon-gray-100 mb-4">
              Generated Test Cases
            </h3>
            <ScrollArea className="h-64">
              <div className="space-y-2">
                {testCases.length > 0 ? (
                  testCases.map((testCase) => (
                    <div key={testCase.id} className="p-3 border border-carbon-gray-20 rounded-lg text-sm">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-carbon-gray-100 truncate">
                          {testCase.name}
                        </span>
                        <Badge className={getPriorityColor(testCase.priority)}>
                          {testCase.priority}
                        </Badge>
                      </div>
                      <p className="text-xs text-carbon-gray-60 mb-2">
                        {testCase.description}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-carbon-gray-50 uppercase">
                          {testCase.type}
                        </span>
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(testCase.status)}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              // Download test case script
                              const blob = new Blob([testCase.testScript || '// No script available'], { type: 'text/plain' });
                              const url = URL.createObjectURL(blob);
                              const a = document.createElement('a');
                              a.href = url;
                              a.download = `${testCase.name.replace(/\s+/g, '_')}.test.js`;
                              document.body.appendChild(a);
                              a.click();
                              document.body.removeChild(a);
                              URL.revokeObjectURL(url);
                            }}
                            className="h-6 px-2 text-xs"
                          >
                            <Download size={10} className="mr-1" />
                            Download
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              // Show test script in modal/dialog
                              const modal = document.createElement('div');
                              modal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.8);display:flex;align-items:center;justify-content:center;z-index:1000';
                              modal.innerHTML = `
                                <div style="background:white;padding:20px;border-radius:8px;max-width:80%;max-height:80%;overflow:auto;position:relative">
                                  <button onclick="this.parentElement.parentElement.remove()" style="position:absolute;top:10px;right:15px;background:none;border:none;font-size:20px;cursor:pointer">&times;</button>
                                  <h3 style="margin:0 0 15px 0">${testCase.name}</h3>
                                  <pre style="background:#f5f5f5;padding:15px;border-radius:4px;overflow:auto;white-space:pre-wrap">${testCase.testScript || '// No script available'}</pre>
                                </div>
                              `;
                              document.body.appendChild(modal);
                            }}
                            className="h-6 px-2 text-xs"
                          >
                            <Eye size={10} className="mr-1" />
                            View
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRunTestWithReview(testCase.id)}
                            disabled={testCase.status === 'running' || runTestMutation.isPending}
                            className="h-6 px-2 text-xs"
                          >
                            <Shield size={10} className="mr-1" />
                            Review & Run
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-center text-carbon-gray-60">
                    <p className="text-sm">No test cases generated yet.</p>
                    <p className="text-xs">Complete the analysis workflow to generate tests.</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Test Environment */}
          <div>
            <h3 className="text-lg font-medium text-carbon-gray-100 mb-4">
              Test Environment
            </h3>
            <div className="space-y-4">
              <div className="p-3 bg-green-50 rounded-lg border border-green-50">
                <div className="flex items-center space-x-2 mb-2">
                  <Check className="text-green-50" size={16} />
                  <span className="text-sm font-medium text-carbon-gray-100">
                    Environment Ready
                  </span>
                </div>
                <p className="text-xs text-carbon-gray-60">
                  Testing infrastructure configured and running
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-medium text-carbon-gray-100">
                  Connected Tools
                </h4>
                <div className="space-y-1">
                  <div className="flex items-center space-x-2 text-sm text-carbon-gray-70">
                    <Check className="text-green-50" size={14} />
                    <span>Selenium Grid</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-carbon-gray-70">
                    <Check className="text-green-50" size={14} />
                    <span>Jest Test Runner</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-carbon-gray-70">
                    <Check className="text-green-50" size={14} />
                    <span>Swagger API Docs</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-carbon-gray-70">
                    <Check className="text-green-50" size={14} />
                    <span>Playwright Browsers</span>
                  </div>
                </div>
              </div>

              <Button 
                className="w-full bg-ibm-blue hover:bg-blue-700"
                disabled={testCases.length === 0 || runTestSuiteMutation.isPending}
                onClick={() => handleRunTestSuiteWithReview()}
              >
                {runTestSuiteMutation.isPending ? (
                  <>
                    <Loader2 size={16} className="mr-2 animate-spin" />
                    Running Suite...
                  </>
                ) : (
                  <>
                    <Shield size={16} className="mr-2" />
                    Review & Run Test Suite
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>

      {/* Test Execution Progress Tracking */}
      <TestExecutionProgress 
        testCases={testCases}
        isRunning={runTestSuiteMutation.isPending || testCases.some(tc => tc.status === 'running')}
        estimatedTimeRemaining={estimatedTimeRemaining || undefined}
        startTime={executionStartTime || undefined}
      />
      
      {/* Human Review Gate */}
      <HumanReviewGate
        testCases={testCases}
        selectedFramework={selectedFramework}
        isReviewMode={isReviewMode}
        onApprove={handleReviewApprove}
        onReject={handleReviewReject}
        onClose={handleReviewClose}
        executionType={executionType}
        selectedTestCase={selectedTestCase}
      />
    </>
  );
}