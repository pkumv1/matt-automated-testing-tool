import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  PlayCircle, 
  Target, 
  Activity, 
  Shield, 
  Zap, 
  Eye,
  AlertTriangle,
  TrendingUp,
  FileText
} from "lucide-react";
import type { Project, TestCase } from "@shared/schema";

interface TestResultsWithRecommendationsProps {
  project: Project;
}

export default function TestResultsWithRecommendations({ project }: TestResultsWithRecommendationsProps) {
  const [selectedTestType, setSelectedTestType] = useState<string>("all");

  const { data: testCases = [], isLoading } = useQuery({
    queryKey: ['/api/projects', project.id, 'test-cases'],
    enabled: !!project.id,
  });

  // Mock execution results and recommendations (in real implementation, these would be fetched from API)
  const executionResults = [
    {
      testId: "security-scan-001",
      platform: "OWASP ZAP",
      status: "failed",
      duration: 12300,
      output: "Found 3 critical vulnerabilities in authentication system",
      errors: ["SQL injection vulnerability in login form", "XSS vulnerability in user profile"],
      metrics: { vulnerabilities: 7, critical: 3, high: 2, medium: 2 }
    },
    {
      testId: "performance-test-001", 
      platform: "k6",
      status: "passed",
      duration: 8500,
      output: "Performance test completed successfully",
      errors: [],
      metrics: { avg_response: 245, requests_per_sec: 1200, error_rate: 0.8 }
    },
    {
      testId: "e2e-test-001",
      platform: "Playwright", 
      status: "passed",
      duration: 4200,
      output: "All user flows executed successfully",
      errors: [],
      metrics: { tests_passed: 15, tests_failed: 0, coverage: 94 }
    }
  ];

  const recommendations = [
    {
      id: 1,
      title: "Fix Critical SQL Injection Vulnerability",
      description: "Immediate action required to patch SQL injection vulnerability in login authentication system",
      category: "security",
      priority: "high",
      impact: "Critical security risk - potential data breach",
      effort: "2-3 days",
      actionable: true,
      relatedTests: ["security-scan-001"]
    },
    {
      id: 2,
      title: "Implement Input Validation",
      description: "Add comprehensive input validation to prevent XSS attacks across all user input fields",
      category: "security", 
      priority: "high",
      impact: "Prevents malicious script execution",
      effort: "1-2 weeks",
      actionable: true,
      relatedTests: ["security-scan-001"]
    },
    {
      id: 3,
      title: "Optimize Database Query Performance",
      description: "Improve response times by optimizing slow database queries identified in performance tests",
      category: "performance",
      priority: "medium", 
      impact: "15-20% improvement in response times",
      effort: "1 week",
      actionable: true,
      relatedTests: ["performance-test-001"]
    },
    {
      id: 4,
      title: "Increase Test Coverage",
      description: "Add more test cases to achieve 98% code coverage target",
      category: "quality",
      priority: "medium",
      impact: "Better bug detection and code quality",
      effort: "2-3 weeks", 
      actionable: true,
      relatedTests: ["e2e-test-001"]
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'passed': return 'text-green-600';
      case 'failed': return 'text-red-600';
      case 'running': return 'text-blue-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passed': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'failed': return <XCircle className="w-4 h-4 text-red-600" />;
      case 'running': return <Clock className="w-4 h-4 text-blue-600" />;
      default: return <PlayCircle className="w-4 h-4 text-gray-600" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'security': return <Shield className="w-4 h-4" />;
      case 'performance': return <Zap className="w-4 h-4" />;
      case 'quality': return <CheckCircle className="w-4 h-4" />;
      case 'accessibility': return <Eye className="w-4 h-4" />;
      default: return <Target className="w-4 h-4" />;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <span>Loading test results...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="results" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="results">Test Results</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
        </TabsList>

        <TabsContent value="results" className="space-y-4">
          {/* Results Summary */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-600">
                  {executionResults.filter(r => r.status === 'passed').length}
                </div>
                <div className="text-sm text-gray-600">Passed</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-red-600">
                  {executionResults.filter(r => r.status === 'failed').length}
                </div>
                <div className="text-sm text-gray-600">Failed</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {Math.round(executionResults.reduce((sum, r) => sum + r.duration, 0) / 1000)}s
                </div>
                <div className="text-sm text-gray-600">Total Time</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {Math.round((executionResults.filter(r => r.status === 'passed').length / executionResults.length) * 100)}%
                </div>
                <div className="text-sm text-gray-600">Pass Rate</div>
              </CardContent>
            </Card>
          </div>

          {/* Individual Test Results */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Test Execution Results
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {executionResults.map((result, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(result.status)}
                        <div>
                          <span className="font-semibold">{result.testId}</span>
                          <div className="text-sm text-gray-600">{result.platform}</div>
                        </div>
                      </div>
                      <Badge variant={result.status === 'passed' ? 'default' : 'destructive'}>
                        {result.status}
                      </Badge>
                    </div>
                    
                    <div className="bg-gray-50 rounded p-3 mb-3">
                      <p className="text-sm">{result.output}</p>
                    </div>
                    
                    {result.errors.length > 0 && (
                      <div className="bg-red-50 border border-red-200 rounded p-3 mb-3">
                        <div className="text-sm text-red-800">
                          <strong>Errors:</strong>
                          <ul className="mt-1 space-y-1">
                            {result.errors.map((error, idx) => (
                              <li key={idx}>• {error}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>Duration: {result.duration}ms</span>
                      <span>
                        Metrics: {Object.entries(result.metrics).map(([k, v]) => `${k}: ${v}`).join(', ')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-4">
          {/* Recommendations Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-red-200 bg-red-50">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-red-600">
                  {recommendations.filter(r => r.priority === 'high').length}
                </div>
                <div className="text-sm text-red-700">High Priority</div>
              </CardContent>
            </Card>
            <Card className="border-orange-200 bg-orange-50">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {recommendations.filter(r => r.priority === 'medium').length}
                </div>
                <div className="text-sm text-orange-700">Medium Priority</div>
              </CardContent>
            </Card>
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {recommendations.filter(r => r.priority === 'low').length}
                </div>
                <div className="text-sm text-blue-700">Low Priority</div>
              </CardContent>
            </Card>
          </div>

          {/* Recommendations List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                AI-Generated Recommendations
                <Badge variant="secondary">{recommendations.length} recommendations</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recommendations.map((rec) => (
                  <div key={rec.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-start gap-3">
                        {getCategoryIcon(rec.category)}
                        <div className="flex-1">
                          <h4 className="font-semibold text-lg mb-1">{rec.title}</h4>
                          <p className="text-gray-600 text-sm mb-3">{rec.description}</p>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <Badge className={getPriorityColor(rec.priority)}>
                          {rec.priority} priority
                        </Badge>
                        {rec.actionable && (
                          <Badge variant="outline" className="text-green-600 border-green-600">
                            Actionable
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div className="bg-blue-50 border border-blue-200 rounded p-3">
                        <div className="font-medium text-blue-800 mb-1">Expected Impact</div>
                        <div className="text-blue-700">{rec.impact}</div>
                      </div>
                      <div className="bg-purple-50 border border-purple-200 rounded p-3">
                        <div className="font-medium text-purple-800 mb-1">Implementation Effort</div>
                        <div className="text-purple-700">{rec.effort}</div>
                      </div>
                    </div>

                    {rec.relatedTests && rec.relatedTests.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <div className="text-xs text-gray-500">
                          <strong>Related Tests:</strong> {rec.relatedTests.join(', ')}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Implementation Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Implementation Roadmap
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {['high', 'medium', 'low'].map((priority, phaseIndex) => {
                  const priorityRecs = recommendations.filter(r => r.priority === priority);
                  if (priorityRecs.length === 0) return null;

                  return (
                    <div key={priority} className="border rounded-lg p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                          priority === 'high' ? 'bg-red-500' :
                          priority === 'medium' ? 'bg-orange-500' : 'bg-blue-500'
                        }`}>
                          {phaseIndex + 1}
                        </div>
                        <div>
                          <h4 className="font-semibold capitalize">Phase {phaseIndex + 1}: {priority} Priority Items</h4>
                          <p className="text-sm text-gray-600">
                            {priorityRecs.length} recommendations • Est. {
                              priority === 'high' ? '1-2 weeks' :
                              priority === 'medium' ? '2-4 weeks' : '1-3 months'
                            }
                          </p>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {priorityRecs.map((rec, index) => (
                          <div key={index} className="text-sm p-2 bg-gray-50 rounded border-l-4 border-gray-300">
                            <div className="font-medium">{rec.title}</div>
                            <div className="text-gray-600 text-xs">{rec.category}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}