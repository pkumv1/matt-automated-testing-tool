import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RefreshCw, Download, Filter, Search, AlertCircle, CheckCircle, Clock, Zap } from "lucide-react";
import type { Project } from "@shared/schema";

interface TestLogsProps {
  project: Project;
}

interface LogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'warning' | 'error' | 'success' | 'debug';
  category: 'test_execution' | 'framework' | 'analysis' | 'system' | 'security' | 'performance';
  message: string;
  details?: any;
  testCaseId?: number;
  framework?: string;
  duration?: number;
}

export default function TestLogs({ project }: TestLogsProps) {
  const [filterLevel, setFilterLevel] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Simulated real-time logs - in production this would come from WebSocket or polling
  const { data: logs = [], refetch } = useQuery<LogEntry[]>({
    queryKey: [`/api/projects/${project.id}/logs`],
    queryFn: async () => {
      // For now, generating comprehensive test logs based on current test execution
      return generateMockLogs(project.id);
    },
    refetchInterval: autoRefresh ? 2000 : false,
  });

  const filteredLogs = logs.filter(log => {
    const levelMatch = filterLevel === 'all' || log.level === filterLevel;
    const categoryMatch = filterCategory === 'all' || log.category === filterCategory;
    const searchMatch = searchTerm === '' || 
      log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.framework?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return levelMatch && categoryMatch && searchMatch;
  });

  const getLogIcon = (level: string) => {
    switch (level) {
      case 'success':
        return <CheckCircle className="text-green-600" size={14} />;
      case 'error':
        return <AlertCircle className="text-red-600" size={14} />;
      case 'warning':
        return <AlertCircle className="text-yellow-600" size={14} />;
      case 'info':
        return <Clock className="text-blue-600" size={14} />;
      case 'debug':
        return <Zap className="text-gray-600" size={14} />;
      default:
        return <Clock className="text-gray-600" size={14} />;
    }
  };

  const getLogColor = (level: string) => {
    switch (level) {
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'info':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      case 'debug':
        return 'bg-gray-50 border-gray-200 text-gray-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const exportLogs = () => {
    const logData = filteredLogs.map(log => ({
      timestamp: log.timestamp,
      level: log.level,
      category: log.category,
      message: log.message,
      framework: log.framework,
      duration: log.duration,
      details: log.details
    }));
    
    const dataStr = JSON.stringify(logData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `test-logs-${project.name}-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-carbon-gray-100">
            Test Execution Logs
          </h2>
          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={autoRefresh ? 'bg-green-50 border-green-200' : ''}
            >
              <RefreshCw size={14} className={autoRefresh ? 'animate-spin' : ''} />
              {autoRefresh ? 'Live' : 'Paused'}
            </Button>
            <Button variant="outline" size="sm" onClick={exportLogs}>
              <Download size={14} />
              Export
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Search logs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm"
            />
          </div>
          
          <select
            value={filterLevel}
            onChange={(e) => setFilterLevel(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="all">All Levels</option>
            <option value="error">Errors</option>
            <option value="warning">Warnings</option>
            <option value="success">Success</option>
            <option value="info">Info</option>
            <option value="debug">Debug</option>
          </select>

          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="all">All Categories</option>
            <option value="test_execution">Test Execution</option>
            <option value="framework">Framework</option>
            <option value="analysis">Analysis</option>
            <option value="security">Security</option>
            <option value="performance">Performance</option>
            <option value="system">System</option>
          </select>

          <div className="text-sm text-gray-600 py-2">
            Showing {filteredLogs.length} of {logs.length} logs
          </div>
        </div>

        {/* Logs Display */}
        <Tabs defaultValue="live" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="live">Live Logs</TabsTrigger>
            <TabsTrigger value="errors">Errors & Warnings</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
          </TabsList>

          <TabsContent value="live" className="mt-4">
            <ScrollArea className="h-96 w-full border rounded-md p-4">
              <div className="space-y-2">
                {filteredLogs.map((log) => (
                  <div
                    key={log.id}
                    className={`p-3 rounded-lg border ${getLogColor(log.level)}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3 flex-1">
                        {getLogIcon(log.level)}
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="text-xs font-medium">
                              {new Date(log.timestamp).toLocaleTimeString()}
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {log.category}
                            </Badge>
                            {log.framework && (
                              <Badge variant="secondary" className="text-xs">
                                {log.framework}
                              </Badge>
                            )}
                            {log.duration && (
                              <span className="text-xs text-gray-500">
                                {log.duration}ms
                              </span>
                            )}
                          </div>
                          <p className="text-sm">{log.message}</p>
                          {log.details && (
                            <details className="mt-2">
                              <summary className="text-xs cursor-pointer text-gray-600">
                                Show details
                              </summary>
                              <pre className="text-xs mt-1 p-2 bg-gray-100 rounded overflow-x-auto">
                                {JSON.stringify(log.details, null, 2)}
                              </pre>
                            </details>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {filteredLogs.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No logs match the current filters
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="errors" className="mt-4">
            <ScrollArea className="h-96 w-full border rounded-md p-4">
              <div className="space-y-2">
                {filteredLogs
                  .filter(log => log.level === 'error' || log.level === 'warning')
                  .map((log) => (
                    <div
                      key={log.id}
                      className={`p-3 rounded-lg border ${getLogColor(log.level)}`}
                    >
                      <div className="flex items-start space-x-3">
                        {getLogIcon(log.level)}
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="text-xs font-medium">
                              {new Date(log.timestamp).toLocaleTimeString()}
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {log.level}
                            </Badge>
                            {log.framework && (
                              <Badge variant="secondary" className="text-xs">
                                {log.framework}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm font-medium">{log.message}</p>
                          {log.details && (
                            <div className="mt-2 p-2 bg-gray-100 rounded text-xs">
                              <strong>Error Details:</strong>
                              <pre className="mt-1 overflow-x-auto">
                                {JSON.stringify(log.details, null, 2)}
                              </pre>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="performance" className="mt-4">
            <ScrollArea className="h-96 w-full border rounded-md p-4">
              <div className="space-y-2">
                {filteredLogs
                  .filter(log => log.category === 'performance' || log.duration)
                  .map((log) => (
                    <div
                      key={log.id}
                      className={`p-3 rounded-lg border ${getLogColor(log.level)}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          {getLogIcon(log.level)}
                          <div>
                            <p className="text-sm">{log.message}</p>
                            <div className="flex items-center space-x-2 mt-1">
                              <span className="text-xs text-gray-500">
                                {new Date(log.timestamp).toLocaleTimeString()}
                              </span>
                              {log.framework && (
                                <Badge variant="secondary" className="text-xs">
                                  {log.framework}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        {log.duration && (
                          <Badge 
                            variant={log.duration > 5000 ? "destructive" : log.duration > 2000 ? "secondary" : "default"}
                            className="text-xs"
                          >
                            {log.duration}ms
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

// Mock log generator - in production this would come from real test execution
function generateMockLogs(projectId: number): LogEntry[] {
  const now = new Date();
  const logs: LogEntry[] = [];
  
  // Generate logs for the last hour with realistic test execution flow
  for (let i = 0; i < 50; i++) {
    const timestamp = new Date(now.getTime() - (i * 60000 + Math.random() * 60000));
    
    logs.push({
      id: `log-${i}`,
      timestamp: timestamp.toISOString(),
      level: Math.random() > 0.8 ? 'error' : Math.random() > 0.6 ? 'warning' : Math.random() > 0.3 ? 'success' : 'info',
      category: ['test_execution', 'framework', 'analysis', 'security', 'performance', 'system'][Math.floor(Math.random() * 6)] as any,
      message: [
        'Test execution started for User Authentication Test',
        'Jest framework initialized successfully',
        'Playwright browser launched on port 9222',
        'OWASP ZAP security scan completed',
        'k6 performance test finished with 95% success rate',
        'Lighthouse accessibility audit passed',
        'API endpoint validation successful',
        'Visual regression test detected UI changes',
        'Database connection established',
        'Test environment setup completed',
        'Error: Test timeout after 30 seconds',
        'Warning: Deprecated API usage detected',
        'Critical security vulnerability found in authentication',
        'Performance threshold exceeded: 5.2s response time',
        'Test suite completed with 85% pass rate'
      ][Math.floor(Math.random() * 15)],
      framework: ['jest', 'playwright', 'k6', 'owasp-zap', 'lighthouse', 'selenium'][Math.floor(Math.random() * 6)],
      duration: Math.floor(Math.random() * 10000),
      details: Math.random() > 0.7 ? {
        testCaseId: 65 + Math.floor(Math.random() * 4),
        stackTrace: 'Error at line 23 in test-auth.spec.js',
        expectedValue: 'true',
        actualValue: 'false',
        browserInfo: 'Chrome 118.0.0.0',
        environment: 'test'
      } : undefined
    });
  }
  
  return logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}