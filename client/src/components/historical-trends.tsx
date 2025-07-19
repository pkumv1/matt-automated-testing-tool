import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  Clock, 
  CheckCircle,
  XCircle,
  AlertTriangle,
  Download,
  Calendar,
  Filter,
  RefreshCw
} from "lucide-react";

interface HistoricalTrendsProps {
  projectId?: number;
}

interface TrendDataPoint {
  date: string;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  successRate: number;
  executionTime: number;
  coverage: number;
  securityIssues: number;
  performanceScore: number;
}

interface MetricSummary {
  current: number;
  previous: number;
  change: number;
  trend: 'up' | 'down' | 'stable';
}

export default function HistoricalTrends({ projectId }: HistoricalTrendsProps) {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [selectedMetric, setSelectedMetric] = useState<string>('success-rate');

  // Mock historical data - in production this would come from API
  const generateMockTrendData = (): TrendDataPoint[] => {
    const data: TrendDataPoint[] = [];
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : timeRange === '90d' ? 90 : 365;
    
    for (let i = days; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      // Generate realistic trend data with some variance
      const baseSuccessRate = 85 + Math.sin(i * 0.1) * 10;
      const totalTests = 120 + Math.floor(Math.random() * 40);
      const passedTests = Math.floor(totalTests * (baseSuccessRate / 100));
      const failedTests = totalTests - passedTests;
      
      data.push({
        date: date.toISOString().split('T')[0],
        totalTests,
        passedTests,
        failedTests,
        successRate: Math.round((passedTests / totalTests) * 100),
        executionTime: 180 + Math.floor(Math.random() * 60),
        coverage: 75 + Math.floor(Math.random() * 20),
        securityIssues: Math.floor(Math.random() * 8),
        performanceScore: 70 + Math.floor(Math.random() * 25)
      });
    }
    
    return data;
  };

  const trendData = generateMockTrendData();

  const calculateMetricSummary = (metric: keyof TrendDataPoint): MetricSummary => {
    const recent = trendData.slice(-7);
    const previous = trendData.slice(-14, -7);
    
    const currentAvg = recent.reduce((sum, item) => sum + (item[metric] as number), 0) / recent.length;
    const previousAvg = previous.reduce((sum, item) => sum + (item[metric] as number), 0) / previous.length;
    
    const change = ((currentAvg - previousAvg) / previousAvg) * 100;
    const trend = Math.abs(change) < 2 ? 'stable' : change > 0 ? 'up' : 'down';
    
    return {
      current: Math.round(currentAvg * 100) / 100,
      previous: Math.round(previousAvg * 100) / 100,
      change: Math.round(change * 100) / 100,
      trend
    };
  };

  const metricSummaries = {
    successRate: calculateMetricSummary('successRate'),
    executionTime: calculateMetricSummary('executionTime'),
    coverage: calculateMetricSummary('coverage'),
    performanceScore: calculateMetricSummary('performanceScore')
  };

  const getTrendIcon = (trend: string, metric: string) => {
    const isPositiveTrend = (metric === 'successRate' || metric === 'coverage' || metric === 'performanceScore') 
      ? trend === 'up' 
      : trend === 'down'; // For execution time, down is good
    
    if (trend === 'stable') return <div className="w-3 h-3 bg-gray-400 rounded-full" />;
    return isPositiveTrend 
      ? <TrendingUp className="h-4 w-4 text-green-500" />
      : <TrendingDown className="h-4 w-4 text-red-500" />;
  };

  const getTrendColor = (trend: string, metric: string) => {
    const isPositiveTrend = (metric === 'successRate' || metric === 'coverage' || metric === 'performanceScore') 
      ? trend === 'up' 
      : trend === 'down';
    
    if (trend === 'stable') return 'text-gray-600';
    return isPositiveTrend ? 'text-green-600' : 'text-red-600';
  };

  const exportTrendData = () => {
    const csvContent = [
      ['Date', 'Total Tests', 'Passed', 'Failed', 'Success Rate %', 'Execution Time (s)', 'Coverage %', 'Security Issues', 'Performance Score'].join(','),
      ...trendData.map(row => [
        row.date,
        row.totalTests,
        row.passedTests,
        row.failedTests,
        row.successRate,
        row.executionTime,
        row.coverage,
        row.securityIssues,
        row.performanceScore
      ].join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `trend-analysis-${timeRange}-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  // Chart color scheme
  const colors = {
    primary: '#3B82F6',
    success: '#10B981',
    warning: '#F59E0B',
    danger: '#EF4444',
    secondary: '#6B7280'
  };

  const pieData = [
    { name: 'Passed Tests', value: trendData[trendData.length - 1]?.passedTests || 0, color: colors.success },
    { name: 'Failed Tests', value: trendData[trendData.length - 1]?.failedTests || 0, color: colors.danger }
  ];

  return (
    <div className="space-y-6">
      {/* Header with Controls */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Historical Trends & Analytics</h2>
          <p className="text-gray-600">Track test performance and quality metrics over time</p>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Time Range Selector */}
          <div className="flex rounded-lg border border-gray-300 p-1">
            {(['7d', '30d', '90d', '1y'] as const).map((range) => (
              <Button
                key={range}
                variant={timeRange === range ? "default" : "ghost"}
                size="sm"
                onClick={() => setTimeRange(range)}
                className="px-3 py-1"
              >
                {range === '7d' ? '7 Days' : range === '30d' ? '30 Days' : range === '90d' ? '90 Days' : '1 Year'}
              </Button>
            ))}
          </div>
          
          <Button onClick={exportTrendData} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          
          <Button variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Key Metrics Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Success Rate</p>
                <div className="flex items-center gap-2">
                  <p className="text-2xl font-bold">{metricSummaries.successRate.current}%</p>
                  {getTrendIcon(metricSummaries.successRate.trend, 'successRate')}
                </div>
                <p className={`text-xs ${getTrendColor(metricSummaries.successRate.trend, 'successRate')}`}>
                  {metricSummaries.successRate.change > 0 ? '+' : ''}{metricSummaries.successRate.change}% vs last period
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Execution Time</p>
                <div className="flex items-center gap-2">
                  <p className="text-2xl font-bold">{metricSummaries.executionTime.current}s</p>
                  {getTrendIcon(metricSummaries.executionTime.trend, 'executionTime')}
                </div>
                <p className={`text-xs ${getTrendColor(metricSummaries.executionTime.trend, 'executionTime')}`}>
                  {metricSummaries.executionTime.change > 0 ? '+' : ''}{metricSummaries.executionTime.change}% vs last period
                </p>
              </div>
              <Clock className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Test Coverage</p>
                <div className="flex items-center gap-2">
                  <p className="text-2xl font-bold">{metricSummaries.coverage.current}%</p>
                  {getTrendIcon(metricSummaries.coverage.trend, 'coverage')}
                </div>
                <p className={`text-xs ${getTrendColor(metricSummaries.coverage.trend, 'coverage')}`}>
                  {metricSummaries.coverage.change > 0 ? '+' : ''}{metricSummaries.coverage.change}% vs last period
                </p>
              </div>
              <BarChart3 className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Performance Score</p>
                <div className="flex items-center gap-2">
                  <p className="text-2xl font-bold">{metricSummaries.performanceScore.current}</p>
                  {getTrendIcon(metricSummaries.performanceScore.trend, 'performanceScore')}
                </div>
                <p className={`text-xs ${getTrendColor(metricSummaries.performanceScore.trend, 'performanceScore')}`}>
                  {metricSummaries.performanceScore.change > 0 ? '+' : ''}{metricSummaries.performanceScore.change}% vs last period
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Interactive Charts */}
      <Tabs defaultValue="success-trend" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="success-trend">Success Rate Trend</TabsTrigger>
          <TabsTrigger value="execution-time">Execution Time</TabsTrigger>
          <TabsTrigger value="coverage-performance">Coverage & Performance</TabsTrigger>
          <TabsTrigger value="test-distribution">Test Distribution</TabsTrigger>
        </TabsList>

        {/* Success Rate Trend */}
        <TabsContent value="success-trend">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-500" />
                Test Success Rate Over Time
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(value) => new Date(value).toLocaleDateString()}
                  />
                  <YAxis domain={[0, 100]} />
                  <Tooltip 
                    labelFormatter={(value) => new Date(value).toLocaleDateString()}
                    formatter={(value: number, name: string) => [
                      `${value}${name === 'successRate' ? '%' : ''}`,
                      name === 'successRate' ? 'Success Rate' : name
                    ]}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="successRate" 
                    stroke={colors.success}
                    strokeWidth={3}
                    dot={{ fill: colors.success, strokeWidth: 2, r: 4 }}
                    name="Success Rate (%)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Execution Time */}
        <TabsContent value="execution-time">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-blue-500" />
                Test Execution Time Trends
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date"
                    tickFormatter={(value) => new Date(value).toLocaleDateString()}
                  />
                  <YAxis />
                  <Tooltip 
                    labelFormatter={(value) => new Date(value).toLocaleDateString()}
                    formatter={(value: number) => [`${value}s`, 'Execution Time']}
                  />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="executionTime"
                    stroke={colors.primary}
                    fill={colors.primary}
                    fillOpacity={0.3}
                    name="Execution Time (seconds)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Coverage & Performance */}
        <TabsContent value="coverage-performance">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-purple-500" />
                Coverage & Performance Metrics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date"
                    tickFormatter={(value) => new Date(value).toLocaleDateString()}
                  />
                  <YAxis domain={[0, 100]} />
                  <Tooltip 
                    labelFormatter={(value) => new Date(value).toLocaleDateString()}
                    formatter={(value: number, name: string) => [
                      `${value}${name.includes('coverage') ? '%' : ''}`,
                      name === 'coverage' ? 'Test Coverage' : 'Performance Score'
                    ]}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="coverage"
                    stroke={colors.success}
                    strokeWidth={2}
                    name="Test Coverage (%)"
                  />
                  <Line
                    type="monotone"
                    dataKey="performanceScore"
                    stroke={colors.warning}
                    strokeWidth={2}
                    name="Performance Score"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Test Distribution */}
        <TabsContent value="test-distribution">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Latest Test Results Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
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
                <CardTitle>Daily Test Volume</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={trendData.slice(-14)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date"
                      tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    />
                    <YAxis />
                    <Tooltip 
                      labelFormatter={(value) => new Date(value).toLocaleDateString()}
                    />
                    <Legend />
                    <Bar dataKey="passedTests" stackId="a" fill={colors.success} name="Passed" />
                    <Bar dataKey="failedTests" stackId="a" fill={colors.danger} name="Failed" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}