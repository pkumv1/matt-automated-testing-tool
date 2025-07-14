import React, { useState } from 'react';
import { useParams, useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import AnalysisWorkflow from "@/components/analysis-workflow";
import TestGeneration from "@/components/test-generation";
import TestResults from "@/components/test-results";
import EnhancedTestGeneration from "@/components/enhanced-test-generation";
import TestLogs from "@/components/test-logs";
import MLTestInsights from "@/components/ml-test-insights";
import { AICodeReview } from "@/components/AICodeReview";
import { VisualRegressionTesting } from "@/components/VisualRegressionTesting";
import ComprehensiveReport from "@/components/comprehensive-report";
import ProductionDeployment from "@/components/production-deployment";
import {
  ArrowLeft,
  Activity,
  Code,
  TestTube,
  CheckCircle,
  AlertCircle,
  Brain,
  Eye,
  FileText,
  Rocket,
  BarChart3,
  Shield,
  Zap,
  GitBranch,
  Bug
} from "lucide-react";

const ProjectDetail = () => {
  const params = useParams();
  const [, setLocation] = useLocation();
  const projectId = parseInt(params.id as string);
  const [activeTab, setActiveTab] = useState("overview");

  // Fetch project details
  const { data: project, isLoading: projectLoading } = useQuery({
    queryKey: ['project', projectId],
    queryFn: async () => {
      const response = await fetch(`/api/projects/${projectId}`);
      if (!response.ok) throw new Error('Failed to fetch project');
      return response.json();
    },
    enabled: !!projectId
  });

  // Fetch project metrics
  const { data: metrics } = useQuery({
    queryKey: ['project-metrics', projectId],
    queryFn: async () => {
      const response = await fetch(`/api/projects/${projectId}/metrics`);
      if (!response.ok) throw new Error('Failed to fetch metrics');
      return response.json();
    },
    enabled: !!projectId
  });

  // Fetch test cases
  const { data: testCases } = useQuery({
    queryKey: ['test-cases', projectId],
    queryFn: async () => {
      const response = await fetch(`/api/projects/${projectId}/test-cases`);
      if (!response.ok) throw new Error('Failed to fetch test cases');
      return response.json();
    },
    enabled: !!projectId
  });

  if (projectLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading project details...</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Alert className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Project Not Found</AlertTitle>
          <AlertDescription>
            The project you're looking for doesn't exist or has been removed.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'analyzing': return 'bg-blue-500';
      case 'failed': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'High': return 'text-red-600 bg-red-100';
      case 'Medium': return 'text-yellow-600 bg-yellow-100';
      case 'Low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header */}
      <div className="mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setLocation('/')}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>
        
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">{project.name}</h1>
            <p className="text-muted-foreground mb-4">{project.description}</p>
            <div className="flex items-center gap-4">
              <Badge variant="outline">
                <Code className="h-3 w-3 mr-1" />
                {project.sourceType}
              </Badge>
              <Badge className={getStatusColor(project.analysisStatus)}>
                <Activity className="h-3 w-3 mr-1 text-white" />
                {project.analysisStatus}
              </Badge>
              {metrics && (
                <Badge className={getRiskColor(metrics.riskLevel)}>
                  <Shield className="h-3 w-3 mr-1" />
                  {metrics.riskLevel} Risk
                </Badge>
              )}
            </div>
          </div>
          
          {metrics && (
            <Card className="w-80">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Project Health</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Code Quality</span>
                      <span>{metrics.codeQuality}%</span>
                    </div>
                    <Progress value={metrics.codeQuality} />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Test Coverage</span>
                      <span>{metrics.testCoverage}%</span>
                    </div>
                    <Progress value={metrics.testCoverage} />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Analysis Progress</span>
                      <span>{metrics.analysisProgress}%</span>
                    </div>
                    <Progress value={metrics.analysisProgress} />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <Separator className="mb-6" />

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid grid-cols-10 w-full">
          <TabsTrigger value="overview">
            <BarChart3 className="h-4 w-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="analysis">
            <Activity className="h-4 w-4 mr-2" />
            Analysis
          </TabsTrigger>
          <TabsTrigger value="ai-review">
            <Brain className="h-4 w-4 mr-2" />
            AI Review
          </TabsTrigger>
          <TabsTrigger value="visual-testing">
            <Eye className="h-4 w-4 mr-2" />
            Visual Tests
          </TabsTrigger>
          <TabsTrigger value="tests">
            <TestTube className="h-4 w-4 mr-2" />
            Tests
          </TabsTrigger>
          <TabsTrigger value="results">
            <CheckCircle className="h-4 w-4 mr-2" />
            Results
          </TabsTrigger>
          <TabsTrigger value="ml-insights">
            <Zap className="h-4 w-4 mr-2" />
            ML Insights
          </TabsTrigger>
          <TabsTrigger value="logs">
            <FileText className="h-4 w-4 mr-2" />
            Logs
          </TabsTrigger>
          <TabsTrigger value="report">
            <FileText className="h-4 w-4 mr-2" />
            Report
          </TabsTrigger>
          <TabsTrigger value="deploy">
            <Rocket className="h-4 w-4 mr-2" />
            Deploy
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Test Cases</CardTitle>
                <CardDescription>Total generated tests</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{testCases?.length || 0}</div>
                {testCases && testCases.length > 0 && (
                  <div className="mt-2 space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Passed</span>
                      <span className="text-green-600">
                        {testCases.filter((tc: any) => tc.status === 'passed').length}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Failed</span>
                      <span className="text-red-600">
                        {testCases.filter((tc: any) => tc.status === 'failed').length}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Pending</span>
                      <span className="text-yellow-600">
                        {testCases.filter((tc: any) => tc.status === 'pending').length}
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Recommendations</CardTitle>
                <CardDescription>Improvement suggestions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{metrics?.totalRecommendations || 0}</div>
                {metrics?.criticalIssues > 0 && (
                  <p className="text-sm text-red-600 mt-2">
                    {metrics.criticalIssues} critical issues found
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Tech Debt</CardTitle>
                <CardDescription>Accumulated technical debt</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{metrics?.techDebt || 'Low'}</div>
                <p className="text-sm text-muted-foreground mt-2">
                  Based on code analysis
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common tasks for this project</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Button 
                  variant="outline" 
                  className="h-24 flex-col"
                  onClick={() => setActiveTab('analysis')}
                >
                  <Activity className="h-6 w-6 mb-2" />
                  <span className="text-sm">Run Analysis</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="h-24 flex-col"
                  onClick={() => setActiveTab('ai-review')}
                >
                  <Brain className="h-6 w-6 mb-2" />
                  <span className="text-sm">AI Code Review</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="h-24 flex-col"
                  onClick={() => setActiveTab('visual-testing')}
                >
                  <Eye className="h-6 w-6 mb-2" />
                  <span className="text-sm">Visual Tests</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="h-24 flex-col"
                  onClick={() => setActiveTab('tests')}
                >
                  <TestTube className="h-6 w-6 mb-2" />
                  <span className="text-sm">Generate Tests</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analysis Tab */}
        <TabsContent value="analysis">
          <AnalysisWorkflow projectId={projectId} />
        </TabsContent>

        {/* AI Code Review Tab */}
        <TabsContent value="ai-review">
          <AICodeReview 
            projectId={projectId} 
            onTestGenerated={(test) => {
              // Handle test generation from AI suggestions
              console.log('Test generated from AI suggestion:', test);
              setActiveTab('tests');
            }}
          />
        </TabsContent>

        {/* Visual Regression Testing Tab */}
        <TabsContent value="visual-testing">
          <VisualRegressionTesting 
            projectId={projectId}
            targetUrl={project.repositoryData?.url || 'https://example.com'}
          />
        </TabsContent>

        {/* Test Generation Tab */}
        <TabsContent value="tests">
          <div className="space-y-6">
            <TestGeneration projectId={projectId} />
            <Separator />
            <EnhancedTestGeneration projectId={projectId} />
          </div>
        </TabsContent>

        {/* Test Results Tab */}
        <TabsContent value="results">
          <TestResults projectId={projectId} />
        </TabsContent>

        {/* ML Insights Tab */}
        <TabsContent value="ml-insights">
          <MLTestInsights projectId={projectId} />
        </TabsContent>

        {/* Logs Tab */}
        <TabsContent value="logs">
          <TestLogs projectId={projectId} />
        </TabsContent>

        {/* Comprehensive Report Tab */}
        <TabsContent value="report">
          <ComprehensiveReport projectId={projectId} />
        </TabsContent>

        {/* Production Deployment Tab */}
        <TabsContent value="deploy">
          <ProductionDeployment projectId={projectId} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProjectDetail;