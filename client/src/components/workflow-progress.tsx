import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  CheckCircle, 
  Clock, 
  Activity, 
  AlertCircle,
  FileText,
  Cog,
  Play,
  BarChart3
} from "lucide-react";
import type { Project, Analysis, TestCase } from "@shared/schema";

interface WorkflowProgressProps {
  project: Project;
  analyses: Analysis[];
  testCases: TestCase[];
}

interface WorkflowStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  status: 'completed' | 'in-progress' | 'pending' | 'failed';
  estimatedTime?: string;
}

export default function WorkflowProgress({ project, analyses, testCases }: WorkflowProgressProps) {
  
  const getAnalysisStatus = () => {
    if (!analyses || analyses.length === 0) return 'pending';
    
    const latestAnalysis = analyses
      .filter(a => a.type === 'initial')
      .sort((a, b) => new Date(b.startedAt || 0).getTime() - new Date(a.startedAt || 0).getTime())[0];
    
    if (!latestAnalysis) return 'pending';
    
    return latestAnalysis.status as 'completed' | 'in-progress' | 'pending' | 'failed';
  };

  const getTestGenerationStatus = () => {
    if (!testCases || testCases.length === 0) return 'pending';
    
    const testAnalysis = analyses.find(a => a.type === 'test');
    if (!testAnalysis) return 'pending';
    
    return testAnalysis.status as 'completed' | 'in-progress' | 'pending' | 'failed';
  };

  const getTestExecutionStatus = () => {
    if (!testCases || testCases.length === 0) return 'pending';
    
    const hasRunningTests = testCases.some(tc => tc.status === 'running');
    const completedTests = testCases.filter(tc => tc.status === 'passed' || tc.status === 'failed');
    const failedTests = testCases.filter(tc => tc.status === 'failed');
    
    if (hasRunningTests) return 'in-progress';
    if (completedTests.length === testCases.length && testCases.length > 0) {
      return failedTests.length > 0 ? 'failed' : 'completed';
    }
    if (completedTests.length > 0) return 'in-progress';
    
    return 'pending';
  };

  const getViewResultsStatus = () => {
    const executionStatus = getTestExecutionStatus();
    if (executionStatus === 'completed' || executionStatus === 'failed') {
      return 'completed';
    }
    return 'pending';
  };

  const analysisStatus = getAnalysisStatus();
  const testGenStatus = getTestGenerationStatus();
  const executionStatus = getTestExecutionStatus();
  const resultsStatus = getViewResultsStatus();

  const steps: WorkflowStep[] = [
    {
      id: 'analysis',
      title: 'Code Analysis',
      description: 'Analyzing project structure and code quality',
      icon: <FileText className="h-5 w-5" />,
      status: analysisStatus,
      estimatedTime: '2-3 minutes'
    },
    {
      id: 'generation',
      title: 'Generate Scripts',
      description: 'Creating comprehensive test suites',
      icon: <Cog className="h-5 w-5" />,
      status: testGenStatus,
      estimatedTime: '3-5 minutes'
    },
    {
      id: 'execution',
      title: 'Test Execution',
      description: 'Running generated test cases',
      icon: <Play className="h-5 w-5" />,
      status: executionStatus,
      estimatedTime: getExecutionTimeEstimate()
    },
    {
      id: 'results',
      title: 'View Results',
      description: 'Comprehensive test reports and analytics',
      icon: <BarChart3 className="h-5 w-5" />,
      status: resultsStatus,
      estimatedTime: 'Real-time'
    }
  ];

  function getExecutionTimeEstimate(): string {
    if (!testCases || testCases.length === 0) return '5-10 minutes';
    
    const unitTests = testCases.filter(tc => tc.type === 'unit').length;
    const integrationTests = testCases.filter(tc => tc.type === 'integration').length;
    const e2eTests = testCases.filter(tc => tc.type === 'e2e').length;
    
    const estimatedMinutes = Math.ceil(
      (unitTests * 0.25) + (integrationTests * 0.75) + (e2eTests * 2)
    );
    
    return `~${Math.max(1, estimatedMinutes)} minutes`;
  }

  const getStepIcon = (step: WorkflowStep) => {
    switch (step.status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'in-progress':
        return <Activity className="h-5 w-5 text-blue-500 animate-pulse" />;
      case 'failed':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStepBadgeColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'in-progress':
        return 'bg-blue-100 text-blue-800 border-blue-300 animate-pulse';
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-600 border-gray-300';
    }
  };

  const getOverallProgress = () => {
    const completedSteps = steps.filter(step => step.status === 'completed').length;
    return Math.round((completedSteps / steps.length) * 100);
  };

  const getCurrentStep = () => {
    const inProgressStep = steps.find(step => step.status === 'in-progress');
    if (inProgressStep) return inProgressStep;
    
    const firstPendingStep = steps.find(step => step.status === 'pending');
    return firstPendingStep || steps[steps.length - 1];
  };

  const currentStep = getCurrentStep();
  const overallProgress = getOverallProgress();

  return (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-blue-500" />
            Workflow Progress
          </CardTitle>
          <Badge variant="outline" className="px-3">
            {overallProgress}% Complete
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Overall Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Overall Progress</span>
            <span className="font-medium">{overallProgress}%</span>
          </div>
          <Progress value={overallProgress} className="h-2" />
          {currentStep && (
            <div className="text-sm text-gray-600">
              Current: {currentStep.title}
              {currentStep.estimatedTime && (
                <span className="ml-2 text-blue-600">
                  (Est. {currentStep.estimatedTime})
                </span>
              )}
            </div>
          )}
        </div>

        {/* Workflow Steps */}
        <div className="space-y-4">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-start gap-4">
              {/* Step Icon */}
              <div className="flex-shrink-0 mt-1">
                {getStepIcon(step)}
              </div>
              
              {/* Step Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-medium text-gray-900">{step.title}</h4>
                  <Badge 
                    variant="outline" 
                    className={`text-xs ${getStepBadgeColor(step.status)}`}
                  >
                    {step.status === 'in-progress' ? 'Running' : 
                     step.status === 'completed' ? 'Done' :
                     step.status === 'failed' ? 'Failed' : 'Pending'}
                  </Badge>
                </div>
                <p className="text-sm text-gray-600">{step.description}</p>
                {step.estimatedTime && step.status === 'in-progress' && (
                  <p className="text-xs text-blue-600 mt-1">
                    Estimated time: {step.estimatedTime}
                  </p>
                )}
              </div>
              
              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div className="absolute left-6 mt-8 h-6 w-px bg-gray-300" />
              )}
            </div>
          ))}
        </div>

        {/* Summary Stats */}
        {testCases.length > 0 && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h5 className="font-medium text-gray-900 mb-2">Test Execution Summary</h5>
            <div className="grid grid-cols-4 gap-4 text-sm">
              <div className="text-center">
                <div className="font-semibold text-green-600">
                  {testCases.filter(tc => tc.status === 'passed').length}
                </div>
                <div className="text-gray-600">Passed</div>
              </div>
              <div className="text-center">
                <div className="font-semibold text-red-600">
                  {testCases.filter(tc => tc.status === 'failed').length}
                </div>
                <div className="text-gray-600">Failed</div>
              </div>
              <div className="text-center">
                <div className="font-semibold text-blue-600">
                  {testCases.filter(tc => tc.status === 'running').length}
                </div>
                <div className="text-gray-600">Running</div>
              </div>
              <div className="text-center">
                <div className="font-semibold text-gray-600">
                  {testCases.filter(tc => !tc.status || tc.status === 'generated' || tc.status === 'pending').length}
                </div>
                <div className="text-gray-600">Pending</div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}