/**
 * Enterprise Test Dashboard Component
 * Provides comprehensive test management and execution dashboard
 */

import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  Activity, 
  CheckCircle, 
  XCircle, 
  Clock, 
  TrendingUp,
  AlertTriangle,
  BarChart3,
  Settings,
  Play,
  Pause,
  RefreshCw
} from "lucide-react";

interface EnterpriseTestDashboardProps {
  projectId?: number;
  testSuites?: any[];
  executionResults?: any[];
  onExecuteTests?: () => void;
  onPauseExecution?: () => void;
  onRefreshData?: () => void;
}

export default function EnterpriseTestDashboard({
  projectId,
  testSuites = [],
  executionResults = [],
  onExecuteTests,
  onPauseExecution,
  onRefreshData
}: EnterpriseTestDashboardProps) {
  const mockMetrics = {
    totalTests: 1247,
    passedTests: 1156,
    failedTests: 67,
    skippedTests: 24,
    executionTime: "14:32",
    coverage: 94.8,
    trendsData: [
      { period: "Week 1", passed: 92, failed: 8 },
      { period: "Week 2", passed: 94, failed: 6 },
      { period: "Week 3", passed: 93, failed: 7 },
      { period: "Week 4", passed: 95, failed: 5 }
    ]
  };

  const calculateSuccessRate = () => {
    const total = mockMetrics.totalTests;
    const passed = mockMetrics.passedTests;
    return total > 0 ? Math.round((passed / total) * 100) : 0;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'passed': return 'bg-green-500';
      case 'failed': return 'bg-red-500';
      case 'skipped': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Enterprise Test Dashboard</h2>
          <p className="text-muted-foreground">
            Comprehensive test execution and monitoring
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={onRefreshData} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={onExecuteTests} size="sm">
            <Play className="h-4 w-4 mr-2" />
            Execute Tests
          </Button>
          <Button onClick={onPauseExecution} variant="outline" size="sm">
            <Pause className="h-4 w-4 mr-2" />
            Pause
          </Button>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tests</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockMetrics.totalTests.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              +12% from last week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{calculateSuccessRate()}%</div>
            <p className="text-xs text-muted-foreground">
              +2.1% from last week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed Tests</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockMetrics.failedTests}</div>
            <p className="text-xs text-muted-foreground">
              -18% from last week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Execution Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockMetrics.executionTime}</div>
            <p className="text-xs text-muted-foreground">
              -8% from last week
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Dashboard Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="execution">Execution</TabsTrigger>
          <TabsTrigger value="results">Results</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Test Coverage</CardTitle>
                <CardDescription>
                  Code coverage across all test suites
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Overall Coverage</span>
                    <span className="text-sm text-muted-foreground">{mockMetrics.coverage}%</span>
                  </div>
                  <Progress value={mockMetrics.coverage} className="w-full" />
                </div>
                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Frontend</span>
                    <span>96.2%</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>Backend</span>
                    <span>93.8%</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>Database</span>
                    <span>89.1%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Test Distribution</CardTitle>
                <CardDescription>
                  Breakdown by test types
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                      <span className="text-sm">Unit Tests</span>
                    </div>
                    <Badge variant="secondary">847</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                      <span className="text-sm">Integration Tests</span>
                    </div>
                    <Badge variant="secondary">234</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                      <span className="text-sm">E2E Tests</span>
                    </div>
                    <Badge variant="secondary">89</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                      <span className="text-sm">Performance Tests</span>
                    </div>
                    <Badge variant="secondary">77</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Recent Test Runs</CardTitle>
              <CardDescription>
                Latest test execution results
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { id: 1, name: "Frontend Integration Suite", status: "passed", duration: "4m 32s", timestamp: "2 hours ago" },
                  { id: 2, name: "API Security Tests", status: "failed", duration: "2m 18s", timestamp: "3 hours ago" },
                  { id: 3, name: "Performance Benchmarks", status: "passed", duration: "8m 45s", timestamp: "5 hours ago" },
                  { id: 4, name: "Database Migration Tests", status: "passed", duration: "1m 56s", timestamp: "6 hours ago" }
                ].map((run) => (
                  <div key={run.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${getStatusColor(run.status)}`}></div>
                      <div>
                        <p className="font-medium">{run.name}</p>
                        <p className="text-sm text-muted-foreground">{run.timestamp}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant={run.status === 'passed' ? 'default' : 'destructive'}>
                        {run.status}
                      </Badge>
                      <p className="text-sm text-muted-foreground mt-1">{run.duration}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="execution" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Test Execution Control</CardTitle>
              <CardDescription>
                Manage and monitor test suite execution
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <Button onClick={onExecuteTests}>
                    <Play className="h-4 w-4 mr-2" />
                    Execute All Tests
                  </Button>
                  <Button variant="outline" onClick={onPauseExecution}>
                    <Pause className="h-4 w-4 mr-2" />
                    Pause Execution
                  </Button>
                  <Button variant="outline">
                    <Settings className="h-4 w-4 mr-2" />
                    Configure
                  </Button>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Execution Progress</span>
                    <span className="text-sm text-muted-foreground">847 / 1247 (68%)</span>
                  </div>
                  <Progress value={68} className="w-full" />
                </div>

                <div className="text-sm text-muted-foreground">
                  Currently executing: Frontend Integration Tests (Suite 3 of 8)
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="results" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Detailed Results</CardTitle>
              <CardDescription>
                Comprehensive test execution results and analytics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  Detailed results will appear here after test execution
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance Trends</CardTitle>
              <CardDescription>
                Historical test performance and success rates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  Trend analysis and historical data visualization
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Dashboard Settings</CardTitle>
              <CardDescription>
                Configure dashboard preferences and test execution settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Settings className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  Dashboard configuration options
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}