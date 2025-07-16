import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  ArrowRight, CheckCircle, FileCode, Play, TestTube, 
  Rocket, Target, Shield, Activity
} from "lucide-react";
import type { Project } from "@shared/schema";

interface WorkflowGuideProps {
  activeProject: Project | null;
  analysisStatus?: string;
  testCasesCount: number;
  onCreateProject: () => void;
  onStartAnalysis: () => void;
  onGenerateTests: () => void;
  onGenerateScripts: () => void;
  onRunTests: () => void;
  onViewResults: () => void;
  workflowState?: {
    projectCreated: boolean;
    analysisStarted: boolean;
    analysisCompleted: boolean;
    testsGenerated: boolean;
    scriptsGenerated: boolean;
    testsRun: boolean;
  };
}

export default function WorkflowGuide({
  activeProject,
  analysisStatus,
  testCasesCount,
  onCreateProject,
  onStartAnalysis,
  onGenerateTests,
  onGenerateScripts,
  onRunTests,
  onViewResults,
  workflowState = {
    projectCreated: false,
    analysisStarted: false,
    analysisCompleted: false,
    testsGenerated: false,
    scriptsGenerated: false,
    testsRun: false
  }
}: WorkflowGuideProps) {
  const steps = [
    {
      id: 1,
      title: "Create Project",
      description: "Import your codebase from GitHub, Google Drive, or JIRA",
      icon: FileCode,
      isComplete: workflowState.projectCreated || !!activeProject,
      isActive: !activeProject && !workflowState.projectCreated,
      action: onCreateProject,
      actionLabel: "Create Project"
    },
    {
      id: 2,
      title: "Code Analysis",
      description: "AI agents analyze your code for risks and quality",
      icon: Activity,
      isComplete: workflowState.analysisCompleted || analysisStatus === 'completed',
      isActive: (workflowState.projectCreated || !!activeProject) && 
                !workflowState.analysisCompleted && 
                analysisStatus !== 'completed',
      action: onStartAnalysis,
      actionLabel: "Start Analysis"
    },
    {
      id: 3,
      title: "Generate Tests",
      description: "Create comprehensive test cases across multiple frameworks",
      icon: TestTube,
      isComplete: workflowState.testsGenerated || testCasesCount > 0,
      isActive: (workflowState.analysisCompleted || analysisStatus === 'completed') && 
                !workflowState.testsGenerated && 
                testCasesCount === 0,
      action: onGenerateTests,
      actionLabel: "Generate Tests"
    },
    {
      id: 4,
      title: "Generate Scripts",
      description: "Create executable test scripts for all platforms",
      icon: FileCode,
      isComplete: workflowState.scriptsGenerated,
      isActive: workflowState.testsGenerated || testCasesCount > 0,
      action: onGenerateScripts,
      actionLabel: "Generate Scripts"
    },
    {
      id: 5,
      title: "Run Tests",
      description: "Execute tests using MCP agents across frameworks",
      icon: Play,
      isComplete: workflowState.testsRun,
      isActive: (workflowState.testsGenerated || testCasesCount > 0) && !workflowState.testsRun,
      action: onRunTests,
      actionLabel: "Run Tests"
    },
    {
      id: 6,
      title: "View Results",
      description: "Analyze test results and get recommendations",
      icon: Target,
      isComplete: false,
      isActive: workflowState.testsRun,
      action: onViewResults,
      actionLabel: "View Results"
    }
  ];

  const completedSteps = steps.filter(s => s.isComplete).length;
  const progress = (completedSteps / steps.length) * 100;

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Rocket className="w-5 h-5" />
            Testing Workflow Guide
          </span>
          <span className="text-sm font-normal text-gray-600">
            {completedSteps} of {steps.length} steps completed
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Progress value={progress} className="mb-6 h-2" />
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isDisabled = index > 0 && !steps[index - 1].isComplete;
            
            return (
              <div
                key={step.id}
                className={`relative ${
                  index < steps.length - 1 ? 'xl:after:content-[""] xl:after:absolute xl:after:top-8 xl:after:left-full xl:after:w-4 xl:after:h-0.5 xl:after:bg-gray-300' : ''
                } ${step.isComplete ? 'xl:after:bg-green-500' : ''}`}
              >
                <div
                  className={`p-4 rounded-lg border-2 transition-all ${
                    step.isComplete
                      ? 'border-green-500 bg-green-50'
                      : step.isActive
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    {step.isComplete ? (
                      <CheckCircle className="w-8 h-8 text-green-600" />
                    ) : (
                      <Icon className={`w-8 h-8 ${
                        step.isActive ? 'text-blue-600' : 'text-gray-400'
                      }`} />
                    )}
                    <span className="text-xs font-medium text-gray-500">
                      Step {step.id}
                    </span>
                  </div>
                  
                  <h3 className={`font-medium mb-1 ${
                    step.isComplete ? 'text-green-900' : 
                    step.isActive ? 'text-blue-900' : 'text-gray-700'
                  }`}>
                    {step.title}
                  </h3>
                  
                  <p className="text-xs text-gray-600 mb-3">
                    {step.description}
                  </p>
                  
                  <Button
                    size="sm"
                    variant={step.isComplete ? "outline" : step.isActive ? "default" : "secondary"}
                    className="w-full text-xs"
                    onClick={step.action}
                    disabled={isDisabled && !step.isComplete}
                  >
                    {step.isComplete ? (
                      <>
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Complete
                      </>
                    ) : (
                      <>
                        {step.actionLabel}
                        <ArrowRight className="w-3 h-3 ml-1" />
                      </>
                    )}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
        
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-900 mb-1">Pro Tip</h4>
              <p className="text-sm text-blue-800">
                For best results, complete each step before moving to the next. 
                The AI agents need analysis results to generate optimal test cases.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}