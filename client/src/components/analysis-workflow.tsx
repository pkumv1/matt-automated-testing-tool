import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Check, Clock, Loader2 } from "lucide-react";
import type { Project } from "@shared/schema";
import { SafeComponentWrapper } from "@/components/safe-component-wrapper";
import { 
  transformToSafeAnalyses,
  createSafeQueryResponse 
} from "@/lib/type-safe-components";
import {
  safeFind,
  getProperty,
  getStringProperty
} from "@/lib/comprehensive-error-fixes";

interface AnalysisWorkflowProps {
  project: Project;
}

export default function AnalysisWorkflow({ project }: AnalysisWorkflowProps) {
  const { data: analysesRaw, isLoading: isLoadingAnalyses, error: analysesError } = useQuery({
    queryKey: ['/api/projects', project.id, 'analyses'],
    queryFn: async () => {
      const response = await fetch(`/api/projects/${project.id}/analyses`);
      if (!response.ok) {
        throw new Error('Failed to fetch analyses');
      }
      return response.json();
    },
    refetchInterval: 2000, // Poll every 2 seconds for updates
  });

  // Safe data transformations
  const analysesResponse = createSafeQueryResponse(
    analysesRaw, isLoadingAnalyses, analysesError, transformToSafeAnalyses, []
  );
  const analyses = analysesResponse.data;

  const steps = [
    { id: "code_acquisition", name: "Code Acquisition", type: "acquisition" },
    { id: "initial_analysis", name: "Initial Analysis", type: "initial_analysis" },
    { id: "architecture_review", name: "Architecture Review", type: "architecture_review" },
    { id: "risk_assessment", name: "Risk Assessment", type: "risk_assessment" },
    { id: "test_generation", name: "Test Generation", type: "test_generation" },
  ];

  const getStepStatus = (stepType: string) => {
    if (stepType === "acquisition") {
      return "completed"; // Always completed since project exists
    }
    
    const analysis = safeFind(analyses, (a: any) => getProperty(a, 'type', '') === stepType);
    const status = analysis?.status || "pending";
    
    // Debug logging
    console.log(`Step ${stepType}: status = ${status}`, analysis);
    
    return status;
  };

  const getStepIcon = (status: string, stepIndex: number) => {
    switch (status) {
      case "completed":
        return <Check size={16} />;
      case "running":
        return <Loader2 size={16} className="animate-spin" />;
      default:
        return <span className="text-sm font-medium">{stepIndex + 1}</span>;
    }
  };

  const getStepColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-50 text-white";
      case "running":
        return "bg-ibm-blue text-white";
      default:
        return "bg-carbon-gray-30 text-carbon-gray-60";
    }
  };

  const completedSteps = steps.filter(step => getStepStatus(step.type) === "completed").length;
  const totalSteps = steps.length;
  const progressPercentage = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;

  // Mock current analysis data using safe accessors
  const currentStep = safeFind(steps, (step: any) => getStepStatus(getProperty(step, 'type', '')) === "running");
  const currentAnalysis = currentStep ? safeFind(analyses, (a: any) => getProperty(a, 'type', '') === getProperty(currentStep, 'type', '')) : null;

  return (
    <SafeComponentWrapper componentName="AnalysisWorkflow">
      <Card className="mb-8">
      <CardContent className="p-6">
        <h2 className="text-xl font-semibold text-carbon-gray-100 mb-6">
          Analysis Workflow
        </h2>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-carbon-gray-100">Analysis Progress</h3>
            <div className="flex items-center space-x-2">
              <div className="text-sm text-carbon-gray-60">
                {completedSteps} of {totalSteps} completed
              </div>
              <div className="w-32 bg-carbon-gray-20 rounded-full h-2">
                <div 
                  className="bg-green-50 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {steps.map((step, index) => {
              const status = getStepStatus(step.type);
              const isCompleted = status === "completed";
              const isRunning = status === "running";
              const isPending = status === "pending";
              
              return (
                <div key={step.id} className={`p-4 border-2 rounded-lg transition-all ${
                  isCompleted ? "border-green-50 bg-green-50 bg-opacity-10" :
                  isRunning ? "border-ibm-blue bg-blue-50" :
                  "border-carbon-gray-20 bg-carbon-gray-10"
                }`}>
                  <div className="flex items-center space-x-3 mb-2">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-medium text-sm ${getStepColor(status)}`}>
                      {getStepIcon(status, index)}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-carbon-gray-100">
                        {step.name}
                      </p>
                    </div>
                  </div>
                  
                  <div className="mb-2">
                    <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      isCompleted ? "bg-green-50 text-white" :
                      isRunning ? "bg-ibm-blue text-white" :
                      "bg-carbon-gray-30 text-carbon-gray-60"
                    }`}>
                      {isCompleted ? "✓ Completed" :
                       isRunning ? "⚡ Running" :
                       "⏳ Pending"}
                    </div>
                  </div>
                  
                  {isRunning && (
                    <div className="text-xs text-carbon-gray-60">
                      AI agent is analyzing...
                    </div>
                  )}
                  
                  {isCompleted && (
                    <div className="text-xs text-green-50">
                      Analysis complete
                    </div>
                  )}
                  
                  {isPending && (
                    <div className="text-xs text-carbon-gray-60">
                      Waiting to start
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Current Analysis Progress */}
        {currentStep && (
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-medium text-carbon-gray-100">
                {currentStep.name}
              </h3>
              <span className="text-sm text-carbon-gray-60">
                Step {steps.findIndex(s => s.id === currentStep.id) + 1} of {totalSteps}
              </span>
            </div>
            <Progress value={progressPercentage} className="mb-4" />
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Languages Detected */}
              <Card className="bg-white">
                <CardContent className="p-4">
                  <h4 className="text-sm font-medium text-carbon-gray-100 mb-2">
                    Languages Detected
                  </h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-carbon-gray-70">JavaScript</span>
                      <span className="text-sm font-medium text-carbon-gray-100">67%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-carbon-gray-70">TypeScript</span>
                      <span className="text-sm font-medium text-carbon-gray-100">23%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-carbon-gray-70">CSS</span>
                      <span className="text-sm font-medium text-carbon-gray-100">10%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Frameworks */}
              <Card className="bg-white">
                <CardContent className="p-4">
                  <h4 className="text-sm font-medium text-carbon-gray-100 mb-2">
                    Frameworks
                  </h4>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-ibm-blue rounded"></div>
                      <span className="text-sm text-carbon-gray-70">React 18.2.0</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-green-50 rounded"></div>
                      <span className="text-sm text-carbon-gray-70">Node.js 18.x</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-carbon-gray-60 rounded"></div>
                      <span className="text-sm text-carbon-gray-70">Express.js</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Analysis Status */}
              <Card className="bg-white">
                <CardContent className="p-4">
                  <h4 className="text-sm font-medium text-carbon-gray-100 mb-2">
                    Analysis Status
                  </h4>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Check className="text-green-50" size={14} />
                      <span className="text-sm text-carbon-gray-70">Dependencies</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Loader2 className="text-ibm-blue animate-spin" size={14} />
                      <span className="text-sm text-carbon-gray-70">Configurations</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Clock className="text-carbon-gray-60" size={14} />
                      <span className="text-sm text-carbon-gray-70">Architecture</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
        </CardContent>
      </Card>
    </SafeComponentWrapper>
  );
}
