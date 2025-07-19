import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CheckCircle, XCircle, Clock, Activity, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Project, TestCase } from "@shared/schema";

interface TestResultsProps {
  project: Project;
}

export default function TestResults({ project }: TestResultsProps) {
  const { data: testCases = [] } = useQuery<TestCase[]>({
    queryKey: [`/api/projects/${project.id}/test-cases`],
    queryFn: async () => {
      const response = await fetch(`/api/projects/${project.id}/test-cases`);
      if (!response.ok) {
        throw new Error('Failed to fetch test cases');
      }
      return response.json();
    },
    refetchInterval: 2000,
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passed':
        return <CheckCircle size={16} className="text-green-500 animate-pulse" />;
      case 'failed':
        return <XCircle size={16} className="text-red-500" />;
      case 'running':
        return <Activity size={16} className="text-blue-500 animate-pulse" />;
      default:
        return <Clock size={16} className="text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'passed':
        return "bg-green-100 text-green-800";
      case 'failed':
        return "bg-red-100 text-red-800";
      case 'running':
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getTestStats = () => {
    const total = testCases.length;
    const passed = testCases.filter(tc => tc.status === 'passed').length;
    const failed = testCases.filter(tc => tc.status === 'failed').length;
    const running = testCases.filter(tc => tc.status === 'running').length;
    const pending = testCases.filter(tc => tc.status === 'generated' || tc.status === 'pending').length;
    
    return { total, passed, failed, running, pending };
  };

  const stats = getTestStats();
  const successRate = stats.total > 0 ? Math.round((stats.passed / stats.total) * 100) : 0;
  
  console.log('TestResults Stats:', {
    stats,
    successRate,
    testCasesWithExecution: testCases.filter(tc => tc.executionTime).length,
    testCasesWithResults: testCases.filter(tc => tc.results).length,
    allStatuses: testCases.map(tc => tc.status)
  });

  const generateDetailedReport = () => {
    const reportContent = `
# Test Execution Report - ${project.name}

## Summary
- **Total Tests**: ${stats.total}
- **Passed**: ${stats.passed}
- **Failed**: ${stats.failed}
- **Running**: ${stats.running}
- **Pending**: ${stats.pending}
- **Success Rate**: ${successRate}%

## Test Results

${testCases.map(tc => `
### ${tc.name}
- **Type**: ${tc.type}
- **Priority**: ${tc.priority}
- **Status**: ${tc.status}
- **Framework**: ${tc.generatedBy}
- **Execution Time**: ${tc.executionTime || 'N/A'}ms
- **Results**: ${tc.results ? JSON.stringify(tc.results, null, 2) : 'No results available'}

---
`).join('')}

Generated on: ${new Date().toLocaleString()}
    `.trim();

    const blob = new Blob([reportContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.name.replace(/\s+/g, '_')}_test_report.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Card className="border-carbon-gray-20">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-medium text-carbon-gray-100">
            Test Execution Results
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={generateDetailedReport}
            disabled={testCases.length === 0}
          >
            <Download size={14} className="mr-2" />
            Download Report
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overview Stats */}
        <div className="grid grid-cols-4 gap-4">
          <div className="text-center p-3 bg-carbon-gray-10 rounded-lg">
            <div className="text-2xl font-bold text-carbon-gray-100">{stats.total}</div>
            <div className="text-xs text-carbon-gray-60">Total Tests</div>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{stats.passed}</div>
            <div className="text-xs text-green-600">Passed</div>
          </div>
          <div className="text-center p-3 bg-red-50 rounded-lg">
            <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
            <div className="text-xs text-red-600">Failed</div>
          </div>
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{stats.running}</div>
            <div className="text-xs text-blue-600">Running</div>
          </div>
        </div>

        {/* Success Rate */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-carbon-gray-100">Success Rate</span>
            <span className="text-sm text-carbon-gray-60">{successRate}%</span>
          </div>
          <Progress value={successRate} className="h-2" />
        </div>

        {/* Individual Test Results */}
        <div>
          <h3 className="text-sm font-medium text-carbon-gray-100 mb-3">Individual Test Results</h3>
          <ScrollArea className="h-64">
            <div className="space-y-2">
              {testCases.length > 0 ? (
                testCases.map((testCase) => (
                  <div key={testCase.id} className="p-3 border border-carbon-gray-20 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-carbon-gray-100 text-sm truncate">
                        {testCase.name}
                      </span>
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(testCase.status)}
                        <Badge className={getStatusColor(testCase.status)}>
                          {testCase.status}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-xs text-carbon-gray-60">
                      <div>
                        <span className="font-medium">Type:</span> {testCase.type}
                      </div>
                      <div>
                        <span className="font-medium">Priority:</span> {testCase.priority}
                      </div>
                      <div>
                        <span className="font-medium">Framework:</span> {testCase.generatedBy}
                      </div>
                      <div>
                        <span className="font-medium">Duration:</span> {testCase.executionTime || '--'}ms
                      </div>
                    </div>

                    {testCase.results && (
                      <div className="mt-2 p-2 bg-carbon-gray-10 rounded text-xs">
                        <div className="font-medium text-carbon-gray-100 mb-1">Results:</div>
                        <div className="text-carbon-gray-60">
                          {typeof testCase.results === 'object' ? (
                            <div>
                              {(testCase.results as any).message && (
                                <div>Message: {(testCase.results as any).message}</div>
                              )}
                              {(testCase.results as any).error && (
                                <div className="text-red-600">Error: {(testCase.results as any).error}</div>
                              )}
                            </div>
                          ) : (
                            testCase.results.toString()
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="p-4 text-center text-carbon-gray-60">
                  No test results available. Run the test suite to see results.
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </CardContent>
    </Card>
  );
}