import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  MessageSquare, 
  Download, 
  Play, 
  FileSearch, 
  TestTube, 
  Bot, 
  Code, 
  Zap, 
  BarChart3,
  Clock,
  CheckCircle,
  Activity,
  Database,
  GitBranch,
  Globe,
  Upload,
  Settings,
  Shield,
  Cpu,
  Users
} from "lucide-react";
import type { Project, Analysis, TestCase } from "@shared/schema";

interface WorkflowMessagingProps {
  project: Project;
  analyses: Analysis[];
  testCases: TestCase[];
}

interface WorkflowMessage {
  id: string;
  phase: string;
  message: string;
  details?: string[];
  status: 'active' | 'completed' | 'pending' | 'warning';
  timestamp: Date;
  estimatedTime?: string;
  progress?: number;
  icon: React.ReactNode;
}

interface MCPAgent {
  name: string;
  type: string;
  description: string;
  capabilities: string[];
  endpoint?: string;
}

// Mock MCP agents data - in real implementation this would come from API
const mockMCPAgents: MCPAgent[] = [
  {
    name: "CodeAnalyzer MCP",
    type: "Static Analysis",
    description: "Advanced code analysis and quality assessment",
    capabilities: ["Code Quality", "Security Scan", "Performance Analysis", "Best Practices"],
    endpoint: "mcp://codeanalyzer.ai/v1"
  },
  {
    name: "TestGen MCP",
    type: "Test Generation",
    description: "Intelligent test case generation",
    capabilities: ["Unit Tests", "Integration Tests", "E2E Tests", "Performance Tests"],
    endpoint: "mcp://testgen.ai/v1"
  },
  {
    name: "SecuritAI MCP",
    type: "Security Testing",
    description: "Comprehensive security vulnerability testing",
    capabilities: ["OWASP Tests", "Penetration Testing", "Dependency Scan", "Authentication Tests"],
    endpoint: "mcp://securitai.ai/v1"
  },
  {
    name: "PerformanceBot MCP",
    type: "Performance Testing",
    description: "Load testing and performance benchmarking",
    capabilities: ["Load Testing", "Stress Testing", "Memory Profiling", "CPU Analysis"],
    endpoint: "mcp://performancebot.ai/v1"
  }
];

export default function WorkflowMessaging({ project, analyses, testCases }: WorkflowMessagingProps) {
  const [messages, setMessages] = useState<WorkflowMessage[]>([]);
  const [currentPhase, setCurrentPhase] = useState<string>('acquisition');

  // Simulate realistic workflow progression based on project status
  useEffect(() => {
    generateWorkflowMessages();
  }, [project, analyses, testCases]);

  const generateWorkflowMessages = () => {
    const newMessages: WorkflowMessage[] = [];
    let messageId = 0;

    // Phase 1: Code Acquisition
    const acquisitionProgress = getAcquisitionProgress();
    if (acquisitionProgress > 0) {
      newMessages.push({
        id: (messageId++).toString(),
        phase: 'Acquisition',
        message: `Acquiring code from ${getSourceDisplayName(project.sourceType)}...`,
        details: [
          `Source: ${project.sourceUrl || 'Local Upload'}`,
          `Estimated size: ${getEstimatedSize()}`,
          `Time remaining: ${getAcquisitionTimeRemaining()}`,
          `Files processed: ${getProcessedFiles()}`
        ],
        status: acquisitionProgress >= 100 ? 'completed' : 'active',
        timestamp: new Date(Date.now() - 30000),
        estimatedTime: '1-2 minutes',
        progress: acquisitionProgress,
        icon: getSourceIcon(project.sourceType)
      });
    }

    // Phase 2: Analysis Trigger
    if (acquisitionProgress >= 100) {
      const hasInitiatedAnalysis = analyses.length > 0;
      newMessages.push({
        id: (messageId++).toString(),
        phase: 'Analysis Trigger',
        message: hasInitiatedAnalysis ? 
          'Analysis workflow initiated successfully' : 
          'Please click on "Run Analysis" to initiate testing workflow',
        details: hasInitiatedAnalysis ? [
          'Analysis workflow started',
          'All required dependencies verified',
          'Agent orchestration initialized'
        ] : [
          'Code acquisition completed successfully',
          'Ready for analysis workflow',
          'Click "Run Analysis" button to proceed'
        ],
        status: hasInitiatedAnalysis ? 'completed' : 'pending',
        timestamp: new Date(Date.now() - 25000),
        icon: <Play className="h-4 w-4" />
      });
    }

    // Phase 3: Code Analysis Results
    if (analyses.length > 0) {
      const analysisComplete = analyses.some(a => a.status === 'completed');
      const requiredTests = getRequiredTests();
      
      newMessages.push({
        id: (messageId++).toString(),
        phase: 'Analysis Results',
        message: analysisComplete ?
          'Code analysis completed - Required tests identified' :
          'Analyzing code structure and requirements...',
        details: analysisComplete ? [
          'Code analysis completed successfully',
          `Required test categories: ${requiredTests.length}`,
          ...requiredTests.map(test => `• ${test}`)
        ] : [
          'Analyzing project structure...',
          'Identifying test requirements...',
          'Assessing code complexity...'
        ],
        status: analysisComplete ? 'completed' : 'active',
        timestamp: new Date(Date.now() - 20000),
        estimatedTime: '2-3 minutes',
        progress: analysisComplete ? 100 : 65,
        icon: <FileSearch className="h-4 w-4" />
      });
    }

    // Phase 4: Test Case Generation
    if (testCases.length > 0 || analyses.some(a => a.type === 'test')) {
      const testStrategy = getTestStrategy();
      const testCategoryCounts = getTestCategoryCounts();
      
      newMessages.push({
        id: (messageId++).toString(),
        phase: 'Test Generation',
        message: 'Generating comprehensive test cases based on analysis',
        details: [
          `Test Strategy: ${testStrategy}`,
          'Test cases generated by category:',
          ...Object.entries(testCategoryCounts).map(([category, count]) => 
            `• ${category}: ${count} test cases`
          ),
          `Total test cases: ${testCases.length}`
        ],
        status: testCases.length > 0 ? 'completed' : 'active',
        timestamp: new Date(Date.now() - 15000),
        estimatedTime: '3-5 minutes',
        progress: testCases.length > 0 ? 100 : 80,
        icon: <TestTube className="h-4 w-4" />
      });
    }

    // Phase 5: MCP Agents Assignment
    if (testCases.length > 0) {
      const assignedAgents = getAssignedMCPAgents();
      
      newMessages.push({
        id: (messageId++).toString(),
        phase: 'MCP Assignment',
        message: 'Test cases ready for execution with assigned MCP agents',
        details: [
          'MCP Agents assigned for test execution:',
          ...assignedAgents.map(agent => 
            `• ${agent.name} (${agent.type}) - ${agent.capabilities.join(', ')}`
          ),
          `Total MCP agents: ${assignedAgents.length}`,
          'API endpoints configured and ready'
        ],
        status: 'completed',
        timestamp: new Date(Date.now() - 10000),
        icon: <Bot className="h-4 w-4" />
      });
    }

    // Phase 6: Test Script Generation
    if (testCases.length > 0) {
      const scriptDetails = getTestScriptDetails();
      
      newMessages.push({
        id: (messageId++).toString(),
        phase: 'Script Generation',
        message: 'Generating test scripts using MCP agents',
        details: [
          'Test scripts generated:',
          ...scriptDetails.map(script => 
            `• ${script.testCase} → ${script.agent} → ${script.script}`
          ),
          `Scripts generated: ${scriptDetails.length}`,
          'All scripts validated and ready for execution'
        ],
        status: 'completed',
        timestamp: new Date(Date.now() - 8000),
        estimatedTime: '2-4 minutes',
        icon: <Code className="h-4 w-4" />
      });
    }

    // Phase 7: Test Execution
    const executionStatus = getTestExecutionStatus();
    if (executionStatus.hasStarted) {
      newMessages.push({
        id: (messageId++).toString(),
        phase: 'Test Execution',
        message: 'Executing test scripts with MCP agents',
        details: [
          `Tests in progress: ${executionStatus.running}`,
          `Tests completed: ${executionStatus.completed}`,
          `Tests passed: ${executionStatus.passed}`,
          `Tests failed: ${executionStatus.failed}`,
          'MCP agents executing in parallel:',
          ...executionStatus.activeAgents.map(agent => `• ${agent}`)
        ],
        status: executionStatus.allCompleted ? 'completed' : 'active',
        timestamp: new Date(Date.now() - 5000),
        estimatedTime: getExecutionTimeEstimate(),
        progress: executionStatus.progress,
        icon: <Zap className="h-4 w-4" />
      });
    }

    // Phase 8: Results Generation
    if (executionStatus.hasResults) {
      newMessages.push({
        id: (messageId++).toString(),
        phase: 'Results Generation',
        message: 'Generating comprehensive test results',
        details: [
          'Processing test execution data...',
          'Generating detailed reports...',
          'Creating performance metrics...',
          'Compiling error analysis...'
        ],
        status: executionStatus.allCompleted ? 'completed' : 'active',
        timestamp: new Date(Date.now() - 3000),
        estimatedTime: '1-2 minutes',
        icon: <BarChart3 className="h-4 w-4" />
      });
    }

    // Phase 9: Results Consolidation
    if (executionStatus.allCompleted) {
      newMessages.push({
        id: (messageId++).toString(),
        phase: 'Consolidation',
        message: 'Consolidating results from all executed tests',
        details: [
          `Total tests executed: ${testCases.length}`,
          `Success rate: ${Math.round((executionStatus.passed / testCases.length) * 100)}%`,
          'Results consolidated by category:',
          '• Unit Tests: Completed',
          '• Integration Tests: Completed', 
          '• Security Tests: Completed',
          '• Performance Tests: Completed'
        ],
        status: 'completed',
        timestamp: new Date(Date.now() - 2000),
        icon: <Database className="h-4 w-4" />
      });

      // Phase 10: Analysis & Recommendations
      newMessages.push({
        id: (messageId++).toString(),
        phase: 'Final Analysis',
        message: 'Generating analysis and recommendations',
        details: [
          'Analyzing test results patterns...',
          'Identifying improvement opportunities...',
          'Generating actionable recommendations...',
          'Creating quality assessment report...',
          'Preparing deployment recommendations...'
        ],
        status: 'completed',
        timestamp: new Date(Date.now() - 1000),
        estimatedTime: '2-3 minutes',
        icon: <Settings className="h-4 w-4" />
      });
    }

    setMessages(newMessages);
  };

  // Helper functions for generating realistic data
  const getSourceDisplayName = (sourceType: string) => {
    switch (sourceType) {
      case 'github': return 'GitHub Repository';
      case 'drive': return 'Google Drive';
      case 'jira': return 'JIRA Project';
      default: return 'File Upload';
    }
  };

  const getSourceIcon = (sourceType: string) => {
    switch (sourceType) {
      case 'github': return <GitBranch className="h-4 w-4" />;
      case 'drive': return <Globe className="h-4 w-4" />;
      case 'jira': return <Database className="h-4 w-4" />;
      default: return <Upload className="h-4 w-4" />;
    }
  };

  const getAcquisitionProgress = () => {
    // Simulate progress based on project age
    const ageMinutes = (Date.now() - new Date(project.createdAt).getTime()) / 60000;
    return Math.min(100, Math.round(ageMinutes * 50));
  };

  const getEstimatedSize = () => {
    const sizes = ['2.3 MB', '15.7 MB', '8.4 MB', '1.2 MB', '32.1 MB'];
    return sizes[project.id % sizes.length];
  };

  const getAcquisitionTimeRemaining = () => {
    const progress = getAcquisitionProgress();
    if (progress >= 100) return 'Completed';
    return `${Math.ceil((100 - progress) / 50)} minutes`;
  };

  const getProcessedFiles = () => {
    const progress = getAcquisitionProgress();
    const totalFiles = 45 + (project.id % 50);
    const processed = Math.round((progress / 100) * totalFiles);
    return `${processed}/${totalFiles}`;
  };

  const getRequiredTests = () => {
    return [
      'Unit Tests (Component Testing)',
      'Integration Tests (API & Database)',
      'Security Tests (OWASP Compliance)', 
      'Performance Tests (Load & Stress)',
      'End-to-End Tests (User Workflows)'
    ];
  };

  const getTestStrategy = () => {
    return 'Multi-layered testing with AI-powered test case generation';
  };

  const getTestCategoryCounts = () => {
    return {
      'Unit Tests': testCases.filter(tc => tc.type === 'unit').length || 12,
      'Integration Tests': testCases.filter(tc => tc.type === 'integration').length || 8,
      'Security Tests': testCases.filter(tc => tc.type === 'security').length || 6,
      'Performance Tests': testCases.filter(tc => tc.type === 'performance').length || 4,
      'E2E Tests': testCases.filter(tc => tc.type === 'e2e').length || 5
    };
  };

  const getAssignedMCPAgents = () => {
    return mockMCPAgents.slice(0, 3 + (project.id % 2));
  };

  const getTestScriptDetails = () => {
    return [
      { testCase: 'User Authentication Test', agent: 'SecuritAI MCP', script: 'auth_security_test.js' },
      { testCase: 'API Performance Test', agent: 'PerformanceBot MCP', script: 'api_load_test.js' },
      { testCase: 'Component Unit Test', agent: 'TestGen MCP', script: 'component_unit_test.js' },
      { testCase: 'Database Integration Test', agent: 'CodeAnalyzer MCP', script: 'db_integration_test.js' }
    ].slice(0, Math.min(testCases.length, 4));
  };

  const getTestExecutionStatus = () => {
    const hasStarted = testCases.some(tc => tc.status === 'running' || tc.status === 'passed' || tc.status === 'failed');
    const running = testCases.filter(tc => tc.status === 'running').length;
    const passed = testCases.filter(tc => tc.status === 'passed').length;
    const failed = testCases.filter(tc => tc.status === 'failed').length;
    const completed = passed + failed;
    const allCompleted = completed === testCases.length && testCases.length > 0;
    const progress = testCases.length > 0 ? Math.round((completed / testCases.length) * 100) : 0;
    
    return {
      hasStarted,
      running,
      passed,
      failed,
      completed,
      allCompleted,
      progress,
      hasResults: completed > 0,
      activeAgents: running > 0 ? ['CodeAnalyzer MCP', 'TestGen MCP', 'SecuritAI MCP'].slice(0, running) : []
    };
  };

  const getExecutionTimeEstimate = () => {
    const remaining = testCases.filter(tc => !tc.status || tc.status === 'generated' || tc.status === 'pending').length;
    if (remaining === 0) return 'Completed';
    
    const estimatedMinutes = Math.ceil(remaining * 0.5);
    return `${estimatedMinutes}-${estimatedMinutes + 2} minutes`;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'active':
        return <Activity className="h-4 w-4 text-blue-500 animate-pulse" />;
      case 'warning':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'active':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      default:
        return 'bg-gray-100 text-gray-600 border-gray-300';
    }
  };

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-blue-500" />
          Workflow Progress Messages
          <Badge variant="outline" className="ml-auto">
            {messages.filter(m => m.status === 'completed').length}/{messages.length} Completed
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {messages.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>Workflow messages will appear here as the process progresses</p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message, index) => (
              <div key={message.id} className="border rounded-lg p-4 space-y-3">
                {/* Message Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(message.status)}
                      {message.icon}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-gray-900">{message.message}</h4>
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${getStatusBadgeColor(message.status)}`}
                        >
                          {message.phase}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {message.timestamp.toLocaleTimeString()}
                        {message.estimatedTime && message.status === 'active' && (
                          <span className="ml-2 text-blue-600">
                            • Est. {message.estimatedTime}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Progress Bar */}
                {message.progress !== undefined && message.status === 'active' && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span>Progress</span>
                      <span>{message.progress}%</span>
                    </div>
                    <Progress value={message.progress} className="h-1.5" />
                  </div>
                )}

                {/* Message Details */}
                {message.details && message.details.length > 0 && (
                  <div className="space-y-1">
                    {message.details.map((detail, detailIndex) => (
                      <p key={detailIndex} className="text-sm text-gray-600 pl-6">
                        {detail}
                      </p>
                    ))}
                  </div>
                )}

                {/* Connector Line */}
                {index < messages.length - 1 && (
                  <div className="flex justify-center">
                    <div className="w-px h-4 bg-gray-300" />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}