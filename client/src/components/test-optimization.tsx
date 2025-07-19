import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell,
  ResponsiveContainer, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  ScatterChart,
  Scatter,
  ZAxis,
  TreeMap
} from "recharts";
import { 
  Zap, 
  Clock, 
  TrendingDown, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Target,
  Cpu,
  HardDrive,
  MemoryStick,
  DollarSign,
  Lightbulb,
  PlayCircle,
  PauseCircle,
  Settings,
  Download,
  Filter,
  RefreshCw,
  Bot,
  Gauge
} from "lucide-react";

interface TestOptimizationProps {
  projectId?: number;
}

interface TestMetric {
  id: string;
  name: string;
  category: 'unit' | 'integration' | 'e2e' | 'performance' | 'security';
  executionTime: number;
  frequency: number;
  lastRun: Date;
  successRate: number;
  resourceCost: number;
  flakyScore: number;
  priority: 'high' | 'medium' | 'low';
  redundancy: number;
  coverage: number;
}

interface OptimizationRecommendation {
  id: string;
  type: 'parallel' | 'skip' | 'combine' | 'split' | 'schedule' | 'cache';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  effort: 'low' | 'medium' | 'high';
  savings: {
    time: number;
    cost: number;
    resources: number;
  };
  tests: string[];
  implemented: boolean;
}

interface ResourceUsage {
  timestamp: string;
  cpuUsage: number;
  memoryUsage: number;
  diskIO: number;
  networkIO: number;
  cost: number;
  parallelTests: number;
}

export default function TestOptimization({ projectId }: TestOptimizationProps) {
  const [selectedTests, setSelectedTests] = useState<string[]>([]);
  const [optimizationEnabled, setOptimizationEnabled] = useState(true);
  const [viewMode, setViewMode] = useState<'performance' | 'cost' | 'flaky' | 'redundant'>('performance');

  // Mock test metrics data
  const testMetrics: TestMetric[] = [
    {
      id: 'test-1',
      name: 'User Authentication Integration Test',
      category: 'integration',
      executionTime: 45.2,
      frequency: 25,
      lastRun: new Date(Date.now() - 3600000),
      successRate: 97.8,
      resourceCost: 0.85,
      flakyScore: 15,
      priority: 'high',
      redundancy: 0,
      coverage: 12.5
    },
    {
      id: 'test-2',
      name: 'API Response Time Performance Test',
      category: 'performance',
      executionTime: 120.7,
      frequency: 15,
      lastRun: new Date(Date.now() - 7200000),
      successRate: 94.2,
      resourceCost: 2.1,
      flakyScore: 32,
      priority: 'medium',
      redundancy: 25,
      coverage: 8.3
    },
    {
      id: 'test-3',
      name: 'Database Connection Unit Test',
      category: 'unit',
      executionTime: 2.3,
      frequency: 45,
      lastRun: new Date(Date.now() - 1800000),
      successRate: 99.1,
      resourceCost: 0.12,
      flakyScore: 5,
      priority: 'low',
      redundancy: 45,
      coverage: 3.2
    },
    {
      id: 'test-4',
      name: 'Security Vulnerability Scan',
      category: 'security',
      executionTime: 340.5,
      frequency: 8,
      lastRun: new Date(Date.now() - 14400000),
      successRate: 89.6,
      resourceCost: 4.2,
      flakyScore: 8,
      priority: 'high',
      redundancy: 0,
      coverage: 18.7
    },
    {
      id: 'test-5',
      name: 'End-to-End User Journey',
      category: 'e2e',
      executionTime: 180.9,
      frequency: 12,
      lastRun: new Date(Date.now() - 10800000),
      successRate: 91.4,
      resourceCost: 3.1,
      flakyScore: 28,
      priority: 'high',
      redundancy: 15,
      coverage: 22.1
    }
  ];

  // Mock optimization recommendations
  const optimizationRecommendations: OptimizationRecommendation[] = [
    {
      id: 'rec-1',
      type: 'parallel',
      title: 'Parallelize Independent Tests',
      description: 'Run 8 unit tests in parallel to reduce execution time by 65%',
      impact: 'high',
      effort: 'low',
      savings: { time: 45.2, cost: 12.50, resources: 35 },
      tests: ['test-1', 'test-3'],
      implemented: false
    },
    {
      id: 'rec-2',
      type: 'skip',
      title: 'Skip Redundant Coverage Tests',
      description: 'Skip 3 tests with >80% redundancy and minimal unique coverage',
      impact: 'medium',
      effort: 'low',
      savings: { time: 23.7, cost: 6.80, resources: 18 },
      tests: ['test-2', 'test-3'],
      implemented: false
    },
    {
      id: 'rec-3',
      type: 'cache',
      title: 'Cache Heavy Setup Operations',
      description: 'Cache database setup for integration tests to save 70% setup time',
      impact: 'high',
      effort: 'medium',
      savings: { time: 67.3, cost: 18.20, resources: 42 },
      tests: ['test-1', 'test-4'],
      implemented: true
    },
    {
      id: 'rec-4',
      type: 'schedule',
      title: 'Smart Test Scheduling',
      description: 'Schedule resource-intensive tests during off-peak hours',
      impact: 'medium',
      effort: 'low',
      savings: { time: 0, cost: 24.50, resources: 28 },
      tests: ['test-4', 'test-5'],
      implemented: false
    }
  ];

  // Mock resource usage data
  const generateResourceData = (): ResourceUsage[] => {
    const data: ResourceUsage[] = [];
    for (let i = 23; i >= 0; i--) {
      const timestamp = new Date();
      timestamp.setHours(timestamp.getHours() - i);
      
      data.push({
        timestamp: timestamp.toISOString(),
        cpuUsage: 30 + Math.floor(Math.random() * 40) + Math.sin(i * 0.5) * 15,
        memoryUsage: 45 + Math.floor(Math.random() * 30) + Math.sin(i * 0.3) * 10,
        diskIO: 20 + Math.floor(Math.random() * 50),
        networkIO: 15 + Math.floor(Math.random() * 35),
        cost: 2.50 + Math.random() * 1.50,
        parallelTests: Math.floor(Math.random() * 8) + 2
      });
    }
    return data;
  };

  const resourceData = generateResourceData();

  const calculateOptimizationImpact = () => {
    const totalTimeSavings = optimizationRecommendations
      .filter(rec => !rec.implemented)
      .reduce((sum, rec) => sum + rec.savings.time, 0);
    
    const totalCostSavings = optimizationRecommendations
      .filter(rec => !rec.implemented)
      .reduce((sum, rec) => sum + rec.savings.cost, 0);
    
    const implementedSavings = optimizationRecommendations
      .filter(rec => rec.implemented)
      .reduce((sum, rec) => sum + rec.savings.time, 0);
    
    return {
      potentialTimeSavings: totalTimeSavings,
      potentialCostSavings: totalCostSavings,
      implementedTimeSavings: implementedSavings,
      implementationRate: (optimizationRecommendations.filter(r => r.implemented).length / optimizationRecommendations.length) * 100
    };
  };

  const optimizationImpact = calculateOptimizationImpact();

  const getTestsByCategory = () => {
    const categories = ['unit', 'integration', 'e2e', 'performance', 'security'];
    return categories.map(category => {
      const tests = testMetrics.filter(test => test.category === category);
      const totalTime = tests.reduce((sum, test) => sum + test.executionTime, 0);
      const avgSuccessRate = tests.reduce((sum, test) => sum + test.successRate, 0) / tests.length || 0;
      
      return {
        category,
        count: tests.length,
        totalTime: Math.round(totalTime),
        avgSuccessRate: Math.round(avgSuccessRate),
        color: category === 'unit' ? '#10B981' : 
               category === 'integration' ? '#3B82F6' :
               category === 'e2e' ? '#8B5CF6' :
               category === 'performance' ? '#F59E0B' : '#EF4444'
      };
    });
  };

  const categoryData = getTestsByCategory();

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getEffortColor = (effort: string) => {
    switch (effort) {
      case 'low': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'high': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const implementRecommendation = (recId: string) => {
    // Mock implementation
    console.log(`Implementing recommendation: ${recId}`);
  };

  const exportOptimizationReport = () => {
    const report = {
      summary: optimizationImpact,
      recommendations: optimizationRecommendations,
      testMetrics: testMetrics,
      resourceUsage: resourceData
    };
    
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `test-optimization-report-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Test Optimization & Resource Analytics</h2>
          <p className="text-gray-600">Identify bottlenecks, reduce costs, and improve test efficiency</p>
        </div>
        
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setOptimizationEnabled(!optimizationEnabled)}
          >
            {optimizationEnabled ? <PauseCircle className="h-4 w-4 mr-2" /> : <PlayCircle className="h-4 w-4 mr-2" />}
            {optimizationEnabled ? 'Disable' : 'Enable'} Auto-Optimization
          </Button>
          
          <Button onClick={exportOptimizationReport} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Optimization Impact Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Potential Time Savings</p>
                <div className="flex items-center gap-2">
                  <p className="text-2xl font-bold text-green-600">{optimizationImpact.potentialTimeSavings.toFixed(1)}s</p>
                  <TrendingDown className="h-4 w-4 text-green-500" />
                </div>
                <p className="text-xs text-green-600">Per test run</p>
              </div>
              <Clock className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Cost Savings</p>
                <div className="flex items-center gap-2">
                  <p className="text-2xl font-bold text-blue-600">${optimizationImpact.potentialCostSavings.toFixed(2)}</p>
                  <DollarSign className="h-4 w-4 text-blue-500" />
                </div>
                <p className="text-xs text-blue-600">Monthly estimate</p>
              </div>
              <TrendingDown className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Implemented Savings</p>
                <div className="flex items-center gap-2">
                  <p className="text-2xl font-bold text-purple-600">{optimizationImpact.implementedTimeSavings.toFixed(1)}s</p>
                  <CheckCircle className="h-4 w-4 text-purple-500" />
                </div>
                <p className="text-xs text-purple-600">Already achieved</p>
              </div>
              <Zap className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Implementation Rate</p>
                <div className="flex items-center gap-2">
                  <p className="text-2xl font-bold text-orange-600">{optimizationImpact.implementationRate.toFixed(0)}%</p>
                  <Target className="h-4 w-4 text-orange-500" />
                </div>
                <Progress value={optimizationImpact.implementationRate} className="mt-1" />
              </div>
              <Gauge className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="recommendations" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="recommendations">AI Recommendations</TabsTrigger>
          <TabsTrigger value="test-analysis">Test Analysis</TabsTrigger>
          <TabsTrigger value="resource-usage">Resource Usage</TabsTrigger>
          <TabsTrigger value="cost-analysis">Cost Analysis</TabsTrigger>
        </TabsList>

        {/* AI Recommendations Tab */}
        <TabsContent value="recommendations" className="space-y-6">
          <div className="space-y-4">
            {optimizationRecommendations.map((recommendation) => (
              <Card key={recommendation.id} className={`${recommendation.implemented ? 'border-green-200 bg-green-50' : ''}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full ${recommendation.implemented ? 'bg-green-500' : 'bg-blue-500'}`}>
                        {recommendation.implemented ? (
                          <CheckCircle className="h-4 w-4 text-white" />
                        ) : (
                          <Bot className="h-4 w-4 text-white" />
                        )}
                      </div>
                      <div>
                        <CardTitle className="text-lg">{recommendation.title}</CardTitle>
                        <p className="text-sm text-gray-600">{recommendation.description}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Badge className={getImpactColor(recommendation.impact)}>
                        {recommendation.impact.toUpperCase()} IMPACT
                      </Badge>
                      <Badge className={getEffortColor(recommendation.effort)}>
                        {recommendation.effort.toUpperCase()} EFFORT
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-3 bg-gray-50 rounded">
                      <div className="text-xl font-bold text-green-600">{recommendation.savings.time.toFixed(1)}s</div>
                      <div className="text-xs text-gray-600">Time Savings</div>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded">
                      <div className="text-xl font-bold text-blue-600">${recommendation.savings.cost.toFixed(2)}</div>
                      <div className="text-xs text-gray-600">Cost Savings</div>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded">
                      <div className="text-xl font-bold text-purple-600">{recommendation.savings.resources}%</div>
                      <div className="text-xs text-gray-600">Resource Savings</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Affects {recommendation.tests.length} test(s)</p>
                      <div className="flex gap-1 mt-1">
                        {recommendation.tests.slice(0, 3).map((testId) => (
                          <Badge key={testId} variant="outline" className="text-xs">
                            {testMetrics.find(t => t.id === testId)?.name.split(' ').slice(0, 2).join(' ')}
                          </Badge>
                        ))}
                        {recommendation.tests.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{recommendation.tests.length - 3} more
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    {!recommendation.implemented && (
                      <Button 
                        onClick={() => implementRecommendation(recommendation.id)}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <Lightbulb className="h-4 w-4 mr-2" />
                        Implement
                      </Button>
                    )}
                    
                    {recommendation.implemented && (
                      <Badge className="bg-green-100 text-green-800">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Implemented
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Test Analysis Tab */}
        <TabsContent value="test-analysis" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Test Performance Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <ScatterChart data={testMetrics}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="executionTime" name="Execution Time" unit="s" />
                    <YAxis dataKey="frequency" name="Frequency" unit="/day" />
                    <ZAxis dataKey="resourceCost" range={[50, 400]} name="Resource Cost" />
                    <Tooltip 
                      cursor={{ strokeDasharray: '3 3' }}
                      formatter={(value, name) => [value, name]}
                      labelFormatter={() => ''}
                    />
                    <Scatter dataKey="resourceCost" fill="#3B82F6" />
                  </ScatterChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Test Categories Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={categoryData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="category" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="count" fill="#3B82F6" name="Test Count" />
                    <Bar dataKey="totalTime" fill="#F59E0B" name="Total Time (s)" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Detailed Test Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {testMetrics.map((test) => (
                  <div key={test.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <Checkbox
                        checked={selectedTests.includes(test.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedTests([...selectedTests, test.id]);
                          } else {
                            setSelectedTests(selectedTests.filter(id => id !== test.id));
                          }
                        }}
                      />
                      <div>
                        <div className="font-medium">{test.name}</div>
                        <div className="text-sm text-gray-600">
                          {test.category} • {test.executionTime.toFixed(1)}s • {test.successRate.toFixed(1)}% success
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-sm font-medium">${test.resourceCost.toFixed(2)}</div>
                        <div className="text-xs text-gray-600">Cost per run</div>
                      </div>
                      
                      {test.flakyScore > 20 && (
                        <Badge variant="destructive" className="text-xs">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Flaky
                        </Badge>
                      )}
                      
                      {test.redundancy > 30 && (
                        <Badge variant="secondary" className="text-xs">
                          Redundant
                        </Badge>
                      )}
                      
                      <Badge className={`text-xs ${test.priority === 'high' ? 'bg-red-100 text-red-800' : test.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
                        {test.priority.toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Resource Usage Tab */}
        <TabsContent value="resource-usage" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Cpu className="h-5 w-5 text-blue-500" />
                  CPU & Memory Usage
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={resourceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="timestamp" 
                      tickFormatter={(value) => new Date(value).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    />
                    <YAxis />
                    <Tooltip 
                      labelFormatter={(value) => new Date(value).toLocaleString()}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="cpuUsage" stroke="#3B82F6" name="CPU %" />
                    <Line type="monotone" dataKey="memoryUsage" stroke="#10B981" name="Memory %" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <HardDrive className="h-5 w-5 text-purple-500" />
                  I/O Operations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={resourceData.slice(-12)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="timestamp" 
                      tickFormatter={(value) => new Date(value).toLocaleTimeString('en-US', { hour: '2-digit' })}
                    />
                    <YAxis />
                    <Tooltip 
                      labelFormatter={(value) => new Date(value).toLocaleString()}
                    />
                    <Legend />
                    <Bar dataKey="diskIO" fill="#8B5CF6" name="Disk I/O" />
                    <Bar dataKey="networkIO" fill="#F59E0B" name="Network I/O" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Resource Optimization Insights</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Alert>
                  <TrendingDown className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Peak Hours:</strong> Resource usage peaks between 2-4 PM. Consider scheduling heavy tests outside this window.
                  </AlertDescription>
                </Alert>
                
                <Alert>
                  <MemoryStick className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Memory Efficiency:</strong> 3 tests are using 40% more memory than optimal. Consider optimization.
                  </AlertDescription>
                </Alert>
                
                <Alert>
                  <Cpu className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Parallel Opportunity:</strong> CPU utilization suggests 2-3 more parallel tests can run safely.
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Cost Analysis Tab */}
        <TabsContent value="cost-analysis" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-green-500" />
                  Cost Trends
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={resourceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="timestamp" 
                      tickFormatter={(value) => new Date(value).toLocaleTimeString('en-US', { hour: '2-digit' })}
                    />
                    <YAxis />
                    <Tooltip 
                      labelFormatter={(value) => new Date(value).toLocaleString()}
                      formatter={(value: number) => [`$${value.toFixed(2)}`, 'Cost per Hour']}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="cost" 
                      stroke="#10B981" 
                      strokeWidth={3}
                      dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Cost Breakdown by Test Category</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ category, totalTime }) => `${category}: $${(totalTime * 0.02).toFixed(2)}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="totalTime"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number) => [`$${(value * 0.02).toFixed(2)}`, 'Estimated Cost']}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Cost Optimization Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">$127.50</div>
                  <div className="text-sm text-gray-600">Current Monthly Cost</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">$89.20</div>
                  <div className="text-sm text-gray-600">Optimized Cost</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">$38.30</div>
                  <div className="text-sm text-gray-600">Monthly Savings</div>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">30%</div>
                  <div className="text-sm text-gray-600">Cost Reduction</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}