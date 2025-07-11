import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Project } from "@shared/schema";

interface SimpleAnalysisProps {
  project: Project;
}

export default function SimpleAnalysis({ project }: SimpleAnalysisProps) {
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
    staleTime: 0, // Always consider data stale
    cacheTime: 0, // Don't cache data
    refetchInterval: project.analysisStatus === 'analyzing' ? 3000 : false,
    enabled: !!project.id,
  });

  // Debug logging
  console.log('SimpleAnalysis Debug:', {
    projectId: project.id,
    projectName: project.name,
    projectStatus: project.analysisStatus,
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

  if (analyses.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <div>No analysis data available for {project.name}</div>
            <div className="text-sm text-gray-500 mt-2">Project ID: {project.id}</div>
            {project.analysisStatus === 'analyzing' && (
              <div className="text-sm text-blue-600 mt-2">Analysis in progress...</div>
            )}
            <button 
              onClick={() => refetch()} 
              className="mt-3 px-3 py-1 text-sm border rounded hover:bg-gray-50"
            >
              Refresh Analysis Data
            </button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const initialAnalysis = analyses.find(a => a.type === 'initial_analysis');
  const riskAssessment = analyses.find(a => a.type === 'risk_assessment');
  
  return (
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
            
            {initialAnalysis && (
              <div className="space-y-3">
                <div>
                  <span className="font-medium">Files Analyzed: </span>
                  <Badge variant="secondary">{initialAnalysis.results?.files || 'N/A'}</Badge>
                </div>
                
                <div>
                  <span className="font-medium">Languages: </span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {initialAnalysis.results?.languages && Object.entries(initialAnalysis.results.languages).map(([lang, count]) => (
                      <Badge key={lang} variant="outline">{lang}: {count}</Badge>
                    ))}
                  </div>
                </div>
                
                <div>
                  <span className="font-medium">Frameworks: </span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {initialAnalysis.results?.frameworks?.map((fw, idx) => (
                      <Badge key={idx} variant="secondary">{fw.name} {fw.version}</Badge>
                    ))}
                  </div>
                </div>
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
          {riskAssessment ? (
            <div className="space-y-4">
              <div>
                <span className="font-medium">Overall Risk: </span>
                <Badge className={
                  riskAssessment.results?.overallRisk === 'high' ? 'bg-red-500' :
                  riskAssessment.results?.overallRisk === 'medium' ? 'bg-yellow-500' :
                  'bg-green-500'
                }>
                  {riskAssessment.results?.overallRisk?.toUpperCase() || 'UNKNOWN'}
                </Badge>
              </div>
              
              <div>
                <span className="font-medium">Security Risks: </span>
                <span className="text-sm">{riskAssessment.results?.securityRisks?.length || 0} found</span>
              </div>
              
              <div>
                <span className="font-medium">Performance Issues: </span>
                <span className="text-sm">{riskAssessment.results?.performanceRisks?.length || 0} found</span>
              </div>
              
              <div>
                <span className="font-medium">Quality Issues: </span>
                <span className="text-sm">{riskAssessment.results?.qualityIssues?.length || 0} found</span>
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
  );
}