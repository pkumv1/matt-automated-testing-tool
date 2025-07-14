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
  const queryClient = useQueryClient();

  const { data: projects = [] } = useQuery({
    queryKey: ['/api/projects'],
  });

  const { data: agents = [] } = useQuery({
    queryKey: ['/api/agents'],
  });

  const { data: testCases = [] } = useQuery({
    queryKey: ['/api/projects', activeProject?.id, 'test-cases'],
    enabled: !!activeProject?.id,
  });

  // Auto-select latest project but stay on dashboard
  if (!activeProject && projects.length > 0 && activeTab === "dashboard" && !userClearedProject) {
    setActiveProject(projects[0]);
  }

  // Cleanup query cache on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      // Clear all project-related queries on component unmount
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
    }
    queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
    queryClient.invalidateQueries({ queryKey: ['/api/agents'] });
  };

  const handleProjectCreated = (project: Project) => {
    clearProjectCache();
    setActiveProject(project);
    setActiveTab("analysis");
    setUserClearedProject(false);
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
  };

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
              <AgentStatus />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}