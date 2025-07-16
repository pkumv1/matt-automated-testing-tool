import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Play, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Project } from "@shared/schema";

interface SimpleAnalysisProps {
  project: Project;
  onAnalysisComplete?: () => void;
}

export default function SimpleAnalysis({ project, onAnalysisComplete }: SimpleAnalysisProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch project to get latest status
  const { data: currentProject, refetch: refetchProject } = useQuery({
    queryKey: [`/api/projects/${project.id}`],
    queryFn: async () => {
      const response = await fetch(`/api/projects/${project.id}`);
      if (!response.ok) throw new Error('Failed to fetch project');
      return response.json();
    },
    refetchInterval: project.analysisStatus === 'analyzing' ? 2000 : false,
  });

  const { data: analyses = [], isLoading, error, refetch } = useQuery({
    queryKey: [`/api/projects/${project.id}/analyses`],
    queryFn: async () => {
      console.log(`Fetching analyses for project ${project.id}`);
      const response = await fetch(`/api/projects/${project.id}/analyses?t=${Date.now()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch analyses');
      }
      const data = await response.json();
      console.log(`Received ${data.length} analyses for project ${project.id}`);
      return data;
    },
    staleTime: 0,
    cacheTime: 0,
    refetchInterval: (currentProject?.analysisStatus || project.analysisStatus) === 'analyzing' ? 3000 : false,
    enabled: !!project.id,
  });

  // Monitor for analysis completion
  useEffect(() => {
    if (currentProject?.analysisStatus === 'completed' && onAnalysisComplete) {
      // Give a slight delay to ensure UI updates are visible
      const timer = setTimeout(() => {
        onAnalysisComplete();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [currentProject?.analysisStatus, onAnalysisComplete]);

  // Mutation to start analysis
  const startAnalysisMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/projects/${project.id}/analyze`, {
        method: 'POST',
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to start analysis');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Analysis Started",
        description: "The analysis workflow has been initiated. This may take a few minutes.",
      });
      // Refresh project and analyses
      refetchProject();
      setTimeout(() => {
        refetch();
        queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
      }, 1000);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to start analysis",
        variant: "destructive",
      });
    },
  });

  const refreshData = () => {
    refetchProject();
    refetch();
    queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
  };

  // Use the latest project status
  const projectStatus = currentProject?.analysisStatus || project.analysisStatus;

  // Debug logging
  console.log('SimpleAnalysis Debug:', {
    projectId: project.id,
    projectName: project.name,
    projectStatus: projectStatus,
    isLoading,
    error: error?.message,
    analysesLength: analyses.length,
    initialAnalysis: analyses.find(a => a.type === 'initial_analysis')?.results ? 'Found' : 'Not found',
    riskAssessment: analyses.find(a => a.type === 'risk_assessment')?.results ? 'Found' : 'Not found'
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading analysis for {project.name}...</div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-500">Error loading analysis: {error.message}</div>
        </CardContent>
      </Card>
    );
  }

  const initialAnalysis = analyses.find(a => a.type === 'initial_analysis');
  const riskAssessment = analyses.find(a => a.type === 'risk_assessment');

  // Show start analysis button if status is pending or failed
  if (projectStatus === 'pending' || projectStatus === 'failed') {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">Analysis Not Started</h3>
              <p className="text-gray-600">Click the button below to start analyzing {project.name}</p>
              <div className="text-sm text-gray-500 mt-2">Project ID: {project.id}</div>
              <Badge className="mt-2" variant={projectStatus === 'failed' ? 'destructive' : 'secondary'}>
                Status: {projectStatus}
              </Badge>
            </div>
            <div className="flex justify-center gap-3">
              <Button 
                onClick={() => startAnalysisMutation.mutate()}
                disabled={startAnalysisMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Play className="w-4 h-4 mr-2" />
                {startAnalysisMutation.isPending ? 'Starting...' : 'Start Analysis'}
              </Button>
              <Button 
                onClick={refreshData}
                variant="outline"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh Status
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show loading state if analyzing
  if (projectStatus === 'analyzing' && analyses.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
            <div>
              <h3 className="text-lg font-semibold">Analysis in Progress</h3>
              <p className="text-gray-600 mt-2">Analyzing {project.name}...</p>
              <p className="text-sm text-gray-500 mt-1">This may take a few minutes</p>
            </div>
            <Button 
              onClick={refreshData}
              variant="outline"
              size="sm"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show empty state if no analyses found
  if (analyses.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center space-y-4">
            <div>No analysis data available for {project.name}</div>
            <div className="text-sm text-gray-500">Project ID: {project.id}</div>
            <Badge>{projectStatus}</Badge>
            <div className="flex justify-center gap-3">
              <Button 
                onClick={() => startAnalysisMutation.mutate()}
                disabled={startAnalysisMutation.isPending}
              >
                <Play className="w-4 h-4 mr-2" />
                Restart Analysis
              </Button>
              <Button 
                onClick={refreshData}
                variant="outline"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Action Bar */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-semibold">Analysis Results</h2>
          <Badge variant={projectStatus === 'completed' ? 'default' : 'secondary'}>
            {projectStatus}
          </Badge>
        </div>
        <Button 
          onClick={refreshData}
          variant="outline"
          size="sm"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Project Overview */}
        <Card>
          <CardHeader>
            <CardTitle>Project Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Project: {project.name}</h4>
                <p className="text-sm text-gray-600">{project.description}</p>
              </div>
              
              {initialAnalysis?.results ? (
                <div className="space-y-3">
                  <div>
                    <span className="font-medium">Files Analyzed: </span>
                    <Badge variant="secondary">{initialAnalysis.results.files || 'N/A'}</Badge>
                  </div>
                  
                  <div>
                    <span className="font-medium">Languages: </span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {initialAnalysis.results.languages && Object.entries(initialAnalysis.results.languages).map(([lang, count]) => (
                        <Badge key={lang} variant="outline">{lang}: {count}</Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <span className="font-medium">Frameworks: </span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {initialAnalysis.results.frameworks?.map((fw, idx) => (
                        <Badge key={idx} variant="secondary">{fw.name} {fw.version}</Badge>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-gray-500 text-sm">
                  Analysis data is being processed...
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Risk Assessment */}
        <Card>
          <CardHeader>
            <CardTitle>Risk Assessment</CardTitle>
          </CardHeader>
          <CardContent>
            {riskAssessment?.results ? (
              <div className="space-y-4">
                <div>
                  <span className="font-medium">Overall Risk: </span>
                  <Badge className={
                    riskAssessment.results.overallRisk === 'high' ? 'bg-red-500' :
                    riskAssessment.results.overallRisk === 'medium' ? 'bg-yellow-500' :
                    'bg-green-500'
                  }>
                    {riskAssessment.results.overallRisk?.toUpperCase() || 'UNKNOWN'}
                  </Badge>
                </div>
                
                <div>
                  <span className="font-medium">Security Risks: </span>
                  <span className="text-sm">{riskAssessment.results.securityRisks?.length || 0} found</span>
                </div>
                
                <div>
                  <span className="font-medium">Performance Issues: </span>
                  <span className="text-sm">{riskAssessment.results.performanceRisks?.length || 0} found</span>
                </div>
                
                <div>
                  <span className="font-medium">Quality Issues: </span>
                  <span className="text-sm">{riskAssessment.results.qualityIssues?.length || 0} found</span>
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-500">
                Risk assessment not available
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}