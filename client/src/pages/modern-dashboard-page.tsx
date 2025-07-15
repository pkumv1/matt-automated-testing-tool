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
import { useToast } from "@/hooks/use-toast";

export default function ModernDashboardPage() {
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [userClearedProject, setUserClearedProject] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: projects = [], refetch: refetchProjects, error: projectsError } = useQuery({
    queryKey: ['/api/projects'],
    refetchInterval: 5000, // Refetch every 5 seconds to ensure data is fresh
    retry: 2, // Retry twice on failure
    onError: (error) => {
      console.error('Failed to fetch projects:', error);
      toast({
        title: "Error loading projects",
        description: "Failed to load projects. Please refresh the page.",
        variant: "destructive",
      });
    },
  });

  const { data: agents = [] } = useQuery({
    queryKey: ['/api/agents'],
  });

  const { data: testCases = [] } = useQuery({
    queryKey: [`/api/projects/${activeProject?.id}/test-cases`],
    enabled: !!activeProject?.id,
  });

  // Auto-select latest project but stay on dashboard
  useEffect(() => {
    if (!activeProject && projects.length > 0 && activeTab === "dashboard" && !userClearedProject) {
      setActiveProject(projects[0]);
    }
  }, [projects, activeProject, activeTab, userClearedProject]);

  // Force refresh projects on mount
  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
  }, []);

  // Clear cache when switching projects
  const clearProjectCache = (projectId?: number) => {
    if (projectId) {
      queryClient.removeQueries({ queryKey: ['/api/projects', projectId] });
      queryClient.removeQueries({ queryKey: [`/api/projects/${projectId}/analyses`] });
      queryClient.removeQueries({ queryKey: ['/api/projects', projectId, 'test-cases'] });
      queryClient.removeQueries({ queryKey: [`/api/projects/${projectId}/test-cases`] });
    }
    queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
    queryClient.invalidateQueries({ queryKey: ['/api/agents'] });
  };

  const handleProjectCreated = async (project: Project) => {
    try {
      clearProjectCache();
      // Force immediate refetch
      await queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
      await refetchProjects();
      
      setActiveProject(project);
      setActiveTab("analysis");
      setUserClearedProject(false);
      
      toast({
        title: "Project created",
        description: `${project.name} has been created successfully.`,
      });
    } catch (error) {
      console.error('Error handling project creation:', error);
    }
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
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    // Invalidate test cases when switching to automated tests tab
    if (tab === "automated-tests" && activeProject) {
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${activeProject.id}/test-cases`] });
    }
  };

  // Save current state to localStorage for persistence
  useEffect(() => {
    if (activeProject) {
      localStorage.setItem('activeProjectId', activeProject.id.toString());
    } else {
      localStorage.removeItem('activeProjectId');
    }
    localStorage.setItem('activeTab', activeTab);
  }, [activeProject, activeTab]);

  // Load state from localStorage on mount
  useEffect(() => {
    const savedProjectId = localStorage.getItem('activeProjectId');
    const savedTab = localStorage.getItem('activeTab');
    
    if (savedTab) {
      setActiveTab(savedTab);
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
              onProjectSelect={handleProjectSelect}
              onNewProject={handleNewProject}
              onStartAnalysis={() => setActiveTab("analysis")}
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
              <SimpleAnalysis project={activeProject} />
            </div>
          )}
          
          {activeTab === "test-generation" && activeProject && (
            <div className="p-8">
              <TestGeneration project={activeProject} />
            </div>
          )}
          
          {activeTab === "ml-insights" && activeProject && (
            <div className="p-8">
              <MLTestInsights project={activeProject} />
            </div>
          )}
          
          {activeTab === "automated-tests" && activeProject && (
            <div className="p-8">
              <EnhancedTestGeneration project={activeProject} />
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