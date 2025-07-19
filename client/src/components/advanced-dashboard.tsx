import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  AreaChart, 
  Area, 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell,
  ResponsiveContainer, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ComposedChart,
  Scatter,
  ScatterChart,
  ZAxis
} from "recharts";
import { 
  BarChart3, 
  TrendingUp, 
  Activity, 
  Zap, 
  Shield, 
  Clock,
  Users,
  Target,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Download,
  Settings,
  Filter,
  Maximize,
  Eye
} from "lucide-react";

interface AdvancedDashboardProps {
  projectId?: number;
}

interface MetricData {
  timestamp: string;
  testsPassed: number;
  testsFailed: number;
  testsSkipped: number;
  executionTime: number;
  coverage: number;
  securityScore: number;
  performanceScore: number;
  activeUsers: number;
  memoryUsage: number;
  cpuUsage: number;
}

interface TestCategoryData {
  category: string;
  passed: number;
  failed: number;
  skipped: number;
  avgTime: number;
  color: string;
}

interface PerformanceMetric {
  endpoint: string;
  responseTime: number;
  throughput: number;
  errorRate: number;
  p95: number;
}

interface SecurityIssue {
  severity: string;
  count: number;
  trend: number;
  color: string;
}

export default function AdvancedDashboard({ projectId }: AdvancedDashboardProps) {
  const [timeRange, setTimeRange] = useState<'1h' | '24h' | '7d' | '30d'>('24h');
  const [selectedMetrics, setSelectedMetrics] = useState(['performance', 'quality', 'security']);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Generate mock real-time data
  const generateTimeSeriesData = (): MetricData[] => {
    const data: MetricData[] = [];
    const hours = timeRange === '1h' ? 12 : timeRange === '24h' ? 24 : timeRange === '7d' ? 168 : 720;
    const interval = timeRange === '1h' ? 5 : timeRange === '24h' ? 60 : 60;

    for (let i = hours; i >= 0; i--) {
      const timestamp = new Date();
      timestamp.setMinutes(timestamp.getMinutes() - (i * interval));
      
      // Generate realistic fluctuating data
      const base = Math.sin(i * 0.1) * 10;
      data.push({
        timestamp: timestamp.toISOString(),
        testsPassed: 85 + Math.floor(Math.random() * 15) + base,
        testsFailed: 8 + Math.floor(Math.random() * 8),
        testsSkipped: 3 + Math.floor(Math.random() * 5),
        executionTime: 180 + Math.floor(Math.random() * 60) + base * 2,
        coverage: 78 + Math.floor(Math.random() * 15) + base,
        securityScore: 82 + Math.floor(Math.random() * 12) + base,
        performanceScore: 87 + Math.floor(Math.random() * 10) + base,
        activeUsers: 12 + Math.floor(Math.random() * 8),
        memoryUsage: 65 + Math.floor(Math.random() * 20) + base,
        cpuUsage: 45 + Math.floor(Math.random() * 30) + base
      });
    }
    return data;
  };

  const timeSeriesData = generateTimeSeriesData();
  const latestData = timeSeriesData[timeSeriesData.length - 1];

  const testCategoryData: TestCategoryData[] = [
    { category: 'Unit Tests', passed: 145, failed: 8, skipped: 3, avgTime: 2.3, color: '#10B981' },
    { category: 'Integration', passed: 67, failed: 5, skipped: 2, avgTime: 12.8, color: '#3B82F6' },
    { category: 'E2E Tests', passed: 23, failed: 3, skipped: 1, avgTime: 45.2, color: '#8B5CF6' },
    { category: 'Performance', passed: 18, failed: 2, skipped: 0, avgTime: 67.5, color: '#F59E0B' },
    { category: 'Security', passed: 31, failed: 4, skipped: 1, avgTime: 23.7, color: '#EF4444' }
  ];

  const performanceData: PerformanceMetric[] = [
    { endpoint: '/api/projects', responseTime: 145, throughput: 1240, errorRate: 0.02, p95: 298 },
    { endpoint: '/api/tests', responseTime: 67, throughput: 2100, errorRate: 0.01, p95: 156 },
    { endpoint: '/api/results', responseTime: 234, throughput: 890, errorRate: 0.05, p95: 567 },
    { endpoint: '/api/analysis', responseTime: 1240, throughput: 340, errorRate: 0.12, p95: 2100 },
    { endpoint: '/api/reports', responseTime: 567, throughput: 120, errorRate: 0.03, p95: 1230 }
  ];

  const securityIssues: SecurityIssue[] = [
    { severity: 'Critical', count: 0, trend: 0, color: '#DC2626' },
    { severity: 'High', count: 2, trend: -1, color: '#EA580C' },
    { severity: 'Medium', count: 8, trend: +2, color: '#D97706' },
    { severity: 'Low', count: 15, trend: +3, color: '#65A30D' },
    { severity: 'Info', count: 23, trend: +1, color: '#0891B2' }
  ];

  const radarData = [
    { metric: 'Performance', current: latestData?.performanceScore || 87, target: 90 },
    { metric: 'Security', current: latestData?.securityScore || 82, target: 95 },
    { metric: 'Coverage', current: latestData?.coverage || 78, target: 85 },
    { metric: 'Quality', current: 84, target: 90 },
    { metric: 'Reliability', current: 91, target: 95 },
    { metric: 'Maintainability', current: 76, target: 80 }
  ];

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    if (timeRange === '1h') return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    if (timeRange === '24h') return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const downloadDashboard = () => {
    // Mock download functionality
    console.log('Downloading dashboard data...');
  };

  const colors = {
    primary: '#3B82F6',
    success: '#10B981',
    warning: '#F59E0B',
    danger: '#EF4444',
    info: '#0891B2',
    purple: '#8B5CF6'
  };

  return (
    <div className="space-y-6">
      {/* Header with Controls */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Advanced Analytics Dashboard</h2>
          <p className="text-gray-600">Real-time metrics and comprehensive data visualization</p>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Time Range Selector */}
          <Select value={timeRange} onValueChange={(value: any) => setTimeRange(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1h">Last Hour</SelectItem>
              <SelectItem value="24h">Last 24h</SelectItem>
              <SelectItem value="7d">Last 7 Days</SelectItem>
              <SelectItem value="30d">Last 30 Days</SelectItem>
            </SelectContent>
          </Select>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
            {autoRefresh ? 'Live' : 'Paused'}
          </Button>
          
          <Button onClick={downloadDashboard} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Tests Passing</p>
                <div className="flex items-center gap-2">
                  <p className="text-2xl font-bold text-green-600">{latestData?.testsPassed || 0}</p>
                  <TrendingUp className="h-4 w-4 text-green-500" />
                </div>
                <p className="text-xs text-green-600">+2.4% vs yesterday</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Response Time</p>
                <div className="flex items-center gap-2">
                  <p className="text-2xl font-bold text-blue-600">{latestData?.executionTime || 0}ms</p>
                  <Activity className="h-4 w-4 text-blue-500" />
                </div>
                <p className="text-xs text-blue-600">-5.2% improvement</p>
              </div>
              <Zap className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Security Score</p>
                <div className="flex items-center gap-2">
                  <p className="text-2xl font-bold text-orange-600">{latestData?.securityScore || 0}</p>
                  <Shield className="h-4 w-4 text-orange-500" />
                </div>
                <p className="text-xs text-orange-600">2 new issues</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Sessions</p>
                <div className="flex items-center gap-2">
                  <p className="text-2xl font-bold text-purple-600">{latestData?.activeUsers || 0}</p>
                  <Users className="h-4 w-4 text-purple-500" />
                </div>
                <p className="text-xs text-purple-600">3 users online</p>
              </div>
              <Activity className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Dashboard Tabs */}
      <Tabs defaultValue="performance" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="quality">Quality Metrics</TabsTrigger>
          <TabsTrigger value="security">Security Analysis</TabsTrigger>
          <TabsTrigger value="resources">Resource Usage</TabsTrigger>
          <TabsTrigger value="overview">360° Overview</TabsTrigger>
        </TabsList>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-blue-500" />
                  Response Time Trends
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={timeSeriesData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="timestamp" tickFormatter={formatTime} />
                    <YAxis />
                    <Tooltip 
                      labelFormatter={(value) => new Date(value).toLocaleString()}
                      formatter={(value: number) => [`${value}ms`, 'Response Time']}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="executionTime" 
                      stroke={colors.primary}
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>API Endpoint Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {performanceData.map((endpoint, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                      <div>
                        <div className="font-medium text-sm">{endpoint.endpoint}</div>
                        <div className="text-xs text-gray-600">
                          {endpoint.throughput} req/min • {endpoint.errorRate}% errors
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold">{endpoint.responseTime}ms</div>
                        <div className="text-xs text-gray-600">P95: {endpoint.p95}ms</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Performance vs Quality Correlation</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <ScatterChart data={timeSeriesData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="executionTime" name="Response Time" unit="ms" />
                  <YAxis dataKey="coverage" name="Coverage" unit="%" />
                  <ZAxis dataKey="testsPassed" range={[50, 400]} name="Tests Passed" />
                  <Tooltip 
                    cursor={{ strokeDasharray: '3 3' }}
                    formatter={(value, name) => [value, name]}
                    labelFormatter={() => ''}
                  />
                  <Scatter dataKey="testsPassed" fill={colors.primary} />
                </ScatterChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Quality Metrics Tab */}
        <TabsContent value="quality" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Test Results Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={testCategoryData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="passed"
                      label={({ category, passed }) => `${category}: ${passed}`}
                    >
                      {testCategoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Test Category Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={testCategoryData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="category" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Legend />
                    <Bar yAxisId="left" dataKey="passed" stackId="a" fill={colors.success} name="Passed" />
                    <Bar yAxisId="left" dataKey="failed" stackId="a" fill={colors.danger} name="Failed" />
                    <Bar yAxisId="right" dataKey="avgTime" fill={colors.warning} name="Avg Time (s)" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Coverage Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={timeSeriesData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="timestamp" tickFormatter={formatTime} />
                  <YAxis domain={[0, 100]} />
                  <Tooltip 
                    labelFormatter={(value) => new Date(value).toLocaleString()}
                    formatter={(value: number) => [`${value}%`, 'Coverage']}
                  />
                  <Area
                    type="monotone"
                    dataKey="coverage"
                    stroke={colors.success}
                    fill={colors.success}
                    fillOpacity={0.3}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Analysis Tab */}
        <TabsContent value="security" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-red-500" />
                  Security Issues by Severity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {securityIssues.map((issue, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: issue.color }}
                        />
                        <span className="font-medium">{issue.severity}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold">{issue.count}</span>
                        <span className={`text-xs ${issue.trend > 0 ? 'text-red-600' : issue.trend < 0 ? 'text-green-600' : 'text-gray-600'}`}>
                          {issue.trend > 0 ? '+' : ''}{issue.trend}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Security Score Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={timeSeriesData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="timestamp" tickFormatter={formatTime} />
                    <YAxis domain={[0, 100]} />
                    <Tooltip 
                      labelFormatter={(value) => new Date(value).toLocaleString()}
                      formatter={(value: number) => [`${value}`, 'Security Score']}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="securityScore" 
                      stroke={colors.danger}
                      strokeWidth={3}
                      dot={{ fill: colors.danger, strokeWidth: 2, r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Resource Usage Tab */}
        <TabsContent value="resources" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>System Resource Usage</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <ComposedChart data={timeSeriesData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="timestamp" tickFormatter={formatTime} />
                    <YAxis />
                    <Tooltip 
                      labelFormatter={(value) => new Date(value).toLocaleString()}
                    />
                    <Legend />
                    <Area 
                      type="monotone" 
                      dataKey="memoryUsage" 
                      fill={colors.primary} 
                      stroke={colors.primary}
                      fillOpacity={0.3}
                      name="Memory %"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="cpuUsage" 
                      stroke={colors.warning}
                      strokeWidth={2}
                      name="CPU %"
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Current Resource Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Memory Usage</span>
                      <span>{latestData?.memoryUsage || 0}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${latestData?.memoryUsage || 0}%` }}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>CPU Usage</span>
                      <span>{latestData?.cpuUsage || 0}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-yellow-600 h-2 rounded-full" 
                        style={{ width: `${latestData?.cpuUsage || 0}%` }}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Active Tests</span>
                      <span>{latestData?.activeUsers || 0}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-600 h-2 rounded-full" 
                        style={{ width: `${Math.min((latestData?.activeUsers || 0) * 5, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* 360° Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Quality Radar</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RadarChart data={radarData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="metric" />
                    <PolarRadiusAxis angle={90} domain={[0, 100]} />
                    <Radar
                      name="Current"
                      dataKey="current"
                      stroke={colors.primary}
                      fill={colors.primary}
                      fillOpacity={0.3}
                      strokeWidth={2}
                    />
                    <Radar
                      name="Target"
                      dataKey="target"
                      stroke={colors.success}
                      fill="transparent"
                      strokeWidth={2}
                      strokeDasharray="5 5"
                    />
                    <Legend />
                  </RadarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Comprehensive Health Score</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className="text-4xl font-bold text-blue-600 mb-2">87.4</div>
                  <div className="text-gray-600">Overall Health Score</div>
                  <Badge className="mt-2 bg-green-100 text-green-800">Excellent</Badge>
                </div>
                
                <div className="space-y-3">
                  {radarData.map((item, index) => {
                    const percentage = (item.current / item.target) * 100;
                    return (
                      <div key={index} className="flex items-center justify-between">
                        <span className="text-sm font-medium">{item.metric}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-20 bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full ${percentage >= 90 ? 'bg-green-500' : percentage >= 70 ? 'bg-yellow-500' : 'bg-red-500'}`}
                              style={{ width: `${Math.min(percentage, 100)}%` }}
                            />
                          </div>
                          <span className="text-sm text-gray-600">{item.current}%</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Multi-Metric Correlation Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <ComposedChart data={timeSeriesData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="timestamp" tickFormatter={formatTime} />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip 
                    labelFormatter={(value) => new Date(value).toLocaleString()}
                  />
                  <Legend />
                  <Line yAxisId="left" type="monotone" dataKey="testsPassed" stroke={colors.success} name="Tests Passed" />
                  <Line yAxisId="left" type="monotone" dataKey="coverage" stroke={colors.primary} name="Coverage %" />
                  <Bar yAxisId="right" dataKey="executionTime" fill={colors.warning} opacity={0.3} name="Execution Time (ms)" />
                </ComposedChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}