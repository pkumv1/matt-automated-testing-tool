import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import ModernSidebar from "@/components/modern-sidebar";
import ModernHeader from "@/components/modern-header";
import ModernDashboard from "@/components/modern-dashboard";
import CodeAcquisition from "@/components/code-acquisition";
import AgentStatus from "@/components/agent-status";
import SimpleAnalysis from "@/components/simple-analysis";
import TestGeneration from "@/components/test-generation";
import EnhancedTestGeneration from "@/components/enhanced-test-generation";
import TestResultsWithRecommendations from "@/components/test-results-with-recommendations";
import ComprehensiveReport from "@/components/comprehensive-report";
import TestLogs from "@/components/test-logs";
import ErrorDetails from "@/components/error-details";
import ProductionDeployment from "@/components/production-deployment";
import ProjectsManagement from "@/components/projects-management";
import AutomatedTestCreation from "@/components/automated-test-creation";
import MLTestInsights from "@/components/ml-test-insights";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bot, Plus, FolderOpen } from "lucide-react";
import type { Project } from "@shared/schema";

export default function ModernDashboardPage() {
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [userClearedProject, setUserClearedProject] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  // Enhanced state to track workflow completion
  const [workflowStatus, setWorkflowStatus] = useState({
    projectCreated: false,
    analysisCompleted: false,
    testsGenerated: false,
    scriptsGenerated: false,
    testsRun: false
  });
  const queryClient = useQueryClient();

  const { data: projects = [], refetch: refetchProjects } = useQuery({
    queryKey: ['/api/projects'],
    refetchInterval: 30000,
  });

  const { data: agents = [] } = useQuery({
    queryKey: ['/api/agents'],
  });

  const { data: testCases = [] } = useQuery({
    queryKey: ['/api/projects', activeProject?.id, 'test-cases'],
    enabled: !!activeProject?.id,
  });

  // Query for test runs
  const { data: testRuns = [] } = useQuery({
    queryKey: ['/api/projects', activeProject?.id, 'test-runs'],
    enabled: !!activeProject?.id,
  });

  // Monitor project analysis status and redirect when complete
  useEffect(() => {
    if (activeProject && activeTab === "analysis") {
      const checkAnalysisStatus = setInterval(() => {
        queryClient.fetchQuery({
          queryKey: [`/api/projects/${activeProject.id}`]
        }).then((updatedProject: Project) => {
          if (updatedProject.analysisStatus === 'completed') {
            clearInterval(checkAnalysisStatus);
            setWorkflowStatus(prev => ({ ...prev, analysisCompleted: true }));
            // Redirect back to dashboard after analysis completes
            setActiveTab("dashboard");
            // Show success notification
            const event = new CustomEvent('show-toast', {
              detail: {
                title: "Analysis Complete",
                description: `Code analysis for ${activeProject.name} has been completed successfully.`
              }
            });
            window.dispatchEvent(event);
          }
        });
      }, 3000); // Check every 3 seconds

      return () => clearInterval(checkAnalysisStatus);
    }
  }, [activeProject, activeTab, queryClient]);

  // Update workflow status based on project data
  useEffect(() => {
    if (activeProject) {
      setWorkflowStatus(prev => ({
        ...prev,
        projectCreated: true,
        analysisCompleted: activeProject.analysisStatus === 'completed',
        testsGenerated: testCases.length > 0,
        scriptsGenerated: testCases.some((tc: any) => tc.scriptGenerated === true),
        testsRun: testRuns.length > 0
      }));
    }
  }, [activeProject, testCases, testRuns]);

  // Auto-select latest project but stay on dashboard
  useEffect(() => {
    if (!activeProject && projects.length > 0 && activeTab === "dashboard" && !userClearedProject) {
      setActiveProject(projects[0]);
    }
  }, [projects, activeProject, activeTab, userClearedProject]);

  // Cleanup query cache on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      queryClient.removeQueries({ queryKey: ['/api/projects'] });
      queryClient.removeQueries({ queryKey: ['/api/agents'] });
    };
  }, [queryClient]);

  // Clear cache when switching projects
  const clearProjectCache = (projectId?: number) => {
    if (projectId) {
      queryClient.removeQueries({ queryKey: ['/api/projects', projectId] });
      queryClient.removeQueries({ queryKey: [`/api/projects/${projectId}/analyses`] });
      queryClient.removeQueries({ queryKey: ['/api/projects', projectId, 'test-cases'] });
      queryClient.removeQueries({ queryKey: [`/api/projects/${projectId}/test-cases`] });
      queryClient.removeQueries({ queryKey: ['/api/projects', projectId, 'test-runs'] });
    }
    queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
    queryClient.invalidateQueries({ queryKey: ['/api/agents'] });
  };

  const handleProjectCreated = async (project: Project) => {
    clearProjectCache();
    setActiveProject(project);
    setWorkflowStatus(prev => ({ ...prev, projectCreated: true }));
    setUserClearedProject(false);
    
    // First go to analysis tab
    setActiveTab("analysis");
    
    // Force refetch to ensure the new project appears
    await refetchProjects();
    
    // Show notification
    const event = new CustomEvent('show-toast', {
      detail: {
        title: "Project Created",
        description: `${project.name} has been created. Starting code analysis...`
      }
    });
    window.dispatchEvent(event);
  };

  const handleProjectSelect = (project: Project) => {
    clearProjectCache(activeProject?.id);
    clearProjectCache(project.id);
    setActiveProject(project);
    setActiveTab("dashboard");
    setUserClearedProject(false);
  };

  const handleNewProject = () => {
    clearProjectCache(activeProject?.id);
    setActiveProject(null);
    setUserClearedProject(true);
    setActiveTab("acquisition");
    // Reset workflow status
    setWorkflowStatus({
      projectCreated: false,
      analysisCompleted: false,
      testsGenerated: false,
      scriptsGenerated: false,
      testsRun: false
    });
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
  };

  // Handle analysis completion
  const handleAnalysisComplete = () => {
    setWorkflowStatus(prev => ({ ...prev, analysisCompleted: true }));
    setActiveTab("dashboard");
    const event = new CustomEvent('show-toast', {
      detail: {
        title: "Analysis Complete",
        description: "Redirecting to dashboard. You can now generate tests."
      }
    });
    window.dispatchEvent(event);
  };

  // Handle test generation completion
  const handleTestsGenerated = () => {
    setWorkflowStatus(prev => ({ ...prev, testsGenerated: true }));
    queryClient.invalidateQueries({ queryKey: ['/api/projects', activeProject?.id, 'test-cases'] });
    setActiveTab("dashboard");
    const event = new CustomEvent('show-toast', {
      detail: {
        title: "Tests Generated",
        description: "Test cases have been generated. You can now generate test scripts."
      }
    });
    window.dispatchEvent(event);
  };

  // Handle scripts generation completion
  const handleScriptsGenerated = () => {
    setWorkflowStatus(prev => ({ ...prev, scriptsGenerated: true }));
    queryClient.invalidateQueries({ queryKey: ['/api/projects', activeProject?.id, 'test-cases'] });
    setActiveTab("dashboard");
    const event = new CustomEvent('show-toast', {
      detail: {
        title: "Scripts Generated",
        description: "Test scripts have been generated. You can now run the tests."
      }
    });
    window.dispatchEvent(event);
  };

  // Handle test run completion
  const handleTestsRun = () => {
    setWorkflowStatus(prev => ({ ...prev, testsRun: true }));
    queryClient.invalidateQueries({ queryKey: ['/api/projects', activeProject?.id, 'test-runs'] });
    setActiveTab("dashboard");
    const event = new CustomEvent('show-toast', {
      detail: {
        title: "Tests Executed",
        description: "Test execution complete. View the results now."
      }
    });
    window.dispatchEvent(event);
  };

  // Save current state to localStorage for persistence
  useEffect(() => {
    if (activeProject) {
      localStorage.setItem('activeProjectId', activeProject.id.toString());
    } else {
      localStorage.removeItem('activeProjectId');
    }
    localStorage.setItem('activeTab', activeTab);
    localStorage.setItem('workflowStatus', JSON.stringify(workflowStatus));
  }, [activeProject, activeTab, workflowStatus]);

  // Load state from localStorage on mount
  useEffect(() => {
    const savedProjectId = localStorage.getItem('activeProjectId');
    const savedTab = localStorage.getItem('activeTab');
    const savedWorkflowStatus = localStorage.getItem('workflowStatus');
    
    if (savedTab) {
      setActiveTab(savedTab);
    }
    
    if (savedWorkflowStatus) {
      try {
        setWorkflowStatus(JSON.parse(savedWorkflowStatus));
      } catch (e) {
        console.error('Failed to parse workflow status', e);
      }
    }
    
    if (savedProjectId && projects.length > 0) {
      const savedProject = projects.find(p => p.id === parseInt(savedProjectId));
      if (savedProject) {
        setActiveProject(savedProject);
      }
    }
  }, [projects]);

  return (
    <div className="flex h-screen bg-gray-50">
      <ModernSidebar 
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        activeProject={activeProject}
        projects={projects}
        onProjectSelect={handleProjectSelect}
        onNewProject={handleNewProject}
        activeTab={activeTab}
        onTabChange={handleTabChange}
      />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <ModernHeader 
          activeProject={activeProject}
          onNewProject={handleNewProject}
          isCollapsed={sidebarCollapsed}
        />
        
        {/* Add proper padding-top to account for fixed header */}
        <main className="flex-1 overflow-auto pt-20">
          {activeTab === "dashboard" && (
            <ModernDashboard 
              activeProject={activeProject}
              projects={projects}
              agents={agents}
              testCases={testCases}
              workflowStatus={workflowStatus}
              onProjectSelect={handleProjectSelect}
              onNewProject={handleNewProject}
              onStartAnalysis={() => setActiveTab("analysis")}
              onTabChange={handleTabChange}
            />
          )}
          
          {activeTab === "projects" && (
            <ProjectsManagement 
              activeProject={activeProject}
              onProjectSelect={handleProjectSelect}
              onNewProject={handleNewProject}
            />
          )}
          
          {activeTab === "acquisition" && (
            <div className="p-8">
              <CodeAcquisition onProjectCreated={handleProjectCreated} />
            </div>
          )}
          
          {activeTab === "analysis" && activeProject && (
            <div className="p-8">
              <SimpleAnalysis 
                project={activeProject} 
                onAnalysisComplete={handleAnalysisComplete}
              />
            </div>
          )}
          
          {activeTab === "test-generation" && activeProject && (
            <div className="p-8">
              <TestGeneration 
                project={activeProject} 
                onTestsGenerated={handleTestsGenerated}
              />
            </div>
          )}
          
          {activeTab === "ml-insights" && activeProject && (
            <div className="p-8">
              <MLTestInsights project={activeProject} />
            </div>
          )}
          
          {activeTab === "automated-tests" && activeProject && (
            <div className="p-8">
              <EnhancedTestGeneration 
                project={activeProject} 
                onScriptsGenerated={handleScriptsGenerated}
              />
            </div>
          )}
          
          {activeTab === "test-results" && activeProject && (
            <div className="p-8">
              <TestResultsWithRecommendations project={activeProject} />
            </div>
          )}
          
          {activeTab === "logs" && activeProject && (
            <div className="p-8">
              <TestLogs project={activeProject} />
            </div>
          )}
          
          {activeTab === "error-analysis" && activeProject && (
            <div className="p-8">
              <ErrorDetails testCases={testCases} />
            </div>
          )}
          
          {activeTab === "reports" && activeProject && (
            <div className="p-8">
              <ComprehensiveReport project={activeProject} />
            </div>
          )}
          
          {activeTab === "production" && activeProject && (
            <div className="p-8">
              <ProductionDeployment project={activeProject} />
            </div>
          )}
          
          {activeTab === "agents" && (
            <div className="p-8">
              <AgentStatus agents={agents} />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}