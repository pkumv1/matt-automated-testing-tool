import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import CodeAcquisition from "@/components/code-acquisition";
import AgentStatus from "@/components/agent-status";
import AnalysisWorkflow from "@/components/analysis-workflow";
import SimpleAnalysis from "@/components/simple-analysis";
import TestGeneration from "@/components/test-generation";
import TestResults from "@/components/test-results";
import ComprehensiveReport from "@/components/comprehensive-report";
import TestLogs from "@/components/test-logs";
import ErrorDetails from "@/components/error-details";
import ProductionDeployment from "@/components/production-deployment";
import WorkflowProgress from "@/components/workflow-progress";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bell, Plus, Bot, RotateCcw, FolderOpen, Clock, CheckCircle, XCircle, Rocket } from "lucide-react";
import type { Project } from "@shared/schema";

export default function Dashboard() {
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [userClearedProject, setUserClearedProject] = useState(false);
  const queryClient = useQueryClient();

  const { data: projects = [] } = useQuery({
    queryKey: ['/api/projects'],
  });

  const { data: agents = [] } = useQuery({
    queryKey: ['/api/agents'],
  });

  // Fetch test cases for the active project
  const { data: testCases = [] } = useQuery({
    queryKey: ['/api/projects', activeProject?.id, 'test-cases'],
    enabled: !!activeProject?.id,
  });

  // Set active project from existing projects if available and not explicitly cleared
  if (!activeProject && projects.length > 0 && activeTab === "dashboard" && !userClearedProject) {
    setActiveProject(projects[0]);
    setActiveTab("analysis"); // Set to analysis tab when auto-selecting project
  }

  const handleProjectCreated = (project: Project) => {
    setActiveProject(project);
    setActiveTab("analysis"); // Set to analysis tab when creating new project
    setUserClearedProject(false);
  };

  const handleNewProject = () => {
    setActiveProject(null);
    setUserClearedProject(true);
    setActiveTab("dashboard");
    // Force refresh of projects to ensure UI updates
    queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
  };

  const tabs = [
    { id: "dashboard", label: "Dashboard" },
    { id: "projects", label: "Projects" },
    { id: "agents", label: "Agents" },
    { id: "reports", label: "Reports" },
    { id: "settings", label: "Settings" },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Bot className="text-white" size={20} />
                </div>
                <div>
                  <h1 className="text-xl font-semibold text-gray-900">MATT Platform</h1>
                  <p className="text-sm text-gray-600">Automated Code Analysis & Testing</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="ghost" className="text-gray-700 hover:text-gray-900">
                <Bell size={16} className="mr-2" />
                <span className="text-sm">Notifications</span>
              </Button>
              <Button 
                onClick={handleNewProject}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Plus size={16} className="mr-2" />
                <span className="text-sm">{activeProject ? 'New Project' : 'Create Project'}</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Navigation */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  if (tab.id !== "dashboard") {
                    setActiveProject(null);
                    setUserClearedProject(true);
                  }
                }}
                className={`px-4 py-3 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? "text-blue-600 border-b-2 border-blue-600"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Project Analysis Sub-Navigation */}
      {activeProject && (
        <nav className="bg-gray-50 border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex space-x-8">
              <button
                onClick={() => setActiveTab("analysis")}
                className={`px-4 py-2 font-medium text-sm transition-colors ${
                  activeTab === "analysis"
                    ? "text-blue-600 border-b-2 border-blue-600"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab("test-generation")}
                className={`px-4 py-2 font-medium text-sm transition-colors ${
                  activeTab === "test-generation"
                    ? "text-blue-600 border-b-2 border-blue-600"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Test Case Generation
              </button>
              <button
                onClick={() => setActiveTab("automated-tests")}
                className={`px-4 py-2 font-medium text-sm transition-colors ${
                  activeTab === "automated-tests"
                    ? "text-blue-600 border-b-2 border-blue-600"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Automated Tests
              </button>
              <button
                onClick={() => setActiveTab("test-results")}
                className={`px-4 py-2 font-medium text-sm transition-colors ${
                  activeTab === "test-results"
                    ? "text-blue-600 border-b-2 border-blue-600"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Test Results
              </button>
              <button
                onClick={() => setActiveTab("logs")}
                className={`px-4 py-2 font-medium text-sm transition-colors ${
                  activeTab === "logs"
                    ? "text-blue-600 border-b-2 border-blue-600"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Logs & Monitor
              </button>
              <button
                onClick={() => setActiveTab("error-analysis")}
                className={`px-4 py-2 font-medium text-sm transition-colors ${
                  activeTab === "error-analysis"
                    ? "text-blue-600 border-b-2 border-blue-600"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Error Analysis
              </button>
              <button
                onClick={() => setActiveTab("production-deployment")}
                className={`px-4 py-2 font-medium text-sm transition-colors ${
                  activeTab === "production-deployment"
                    ? "text-blue-600 border-b-2 border-blue-600"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Production
              </button>
            </div>
          </div>
        </nav>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {activeTab === "dashboard" && !activeProject && (
          <div className="text-center py-16">
            <Bot size={48} className="mx-auto text-gray-400 mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome to MATT Platform</h2>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              Mars Automated Testing Tool - Start by creating a new project or selecting an existing one to begin automated testing.
            </p>
            <div className="space-y-4">
              <Button onClick={handleNewProject} size="lg" className="bg-blue-600 hover:bg-blue-700">
                <Plus size={20} className="mr-2" />
                Create New Project
              </Button>
              {projects.length > 0 && (
                <div className="mt-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Projects</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {projects.slice(0, 6).map((project) => (
                      <Card key={project.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveProject(project)}>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium">{project.name}</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-xs text-gray-600 mb-2">{project.description}</p>
                          <Badge variant="secondary" className="text-xs">
                            {project.source}
                          </Badge>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "dashboard" && activeProject && (
          <div className="space-y-6">
            {/* Workflow Progress */}
            <WorkflowProgress 
              project={activeProject} 
              analyses={analyses} 
              testCases={testCases} 
            />
            
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h1 className="text-xl font-bold text-gray-900">{activeProject.name}</h1>
                  <p className="text-sm text-gray-600">{activeProject.description}</p>
                </div>
                <Badge variant="secondary">{activeProject.source}</Badge>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Test Cases</p>
                        <p className="text-2xl font-bold text-gray-900">{testCases.length}</p>
                      </div>
                      <CheckCircle className="h-6 w-6 text-green-500" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Active Agents</p>
                        <p className="text-2xl font-bold text-gray-900">{agents.filter(a => a.status === 'active').length}</p>
                      </div>
                      <Bot className="h-6 w-6 text-blue-500" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Status</p>
                        <p className="text-2xl font-bold text-gray-900">Ready</p>
                      </div>
                      <Rocket className="h-6 w-6 text-purple-500" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="flex space-x-4">
                <Button onClick={() => setActiveTab("analysis")} variant="default">
                  <FolderOpen size={16} className="mr-2" />
                  View Analysis
                </Button>
                <Button onClick={() => setActiveTab("test-generation")} variant="outline">
                  <RotateCcw size={16} className="mr-2" />
                  Generate Tests
                </Button>
              </div>
            </div>
          </div>
        )}

        {activeTab === "projects" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Projects</h2>
              <Button onClick={handleNewProject}>
                <Plus size={16} className="mr-2" />
                New Project
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((project) => (
                <Card key={project.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => {
                  setActiveProject(project);
                  setActiveTab("analysis");
                }}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>{project.name}</span>
                      <Badge variant="secondary">{project.source}</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 mb-4">{project.description}</p>
                    <div className="flex items-center text-sm text-gray-500">
                      <Clock size={16} className="mr-1" />
                      {new Date(project.createdAt).toLocaleDateString()}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {activeTab === "agents" && <AgentStatus />}
        {activeTab === "reports" && <ComprehensiveReport />}
        {activeTab === "settings" && (
          <div className="text-center py-16">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Settings</h2>
            <p className="text-gray-600">Settings panel coming soon.</p>
          </div>
        )}

        {activeProject && activeTab === "analysis" && <SimpleAnalysis projectId={activeProject.id} />}
        {activeProject && activeTab === "test-generation" && <TestGeneration projectId={activeProject.id} />}
        {activeProject && activeTab === "automated-tests" && <AnalysisWorkflow projectId={activeProject.id} />}
        {activeProject && activeTab === "test-results" && <TestResults projectId={activeProject.id} />}
        {activeProject && activeTab === "logs" && <TestLogs projectId={activeProject.id} />}
        {activeProject && activeTab === "error-analysis" && <ErrorDetails projectId={activeProject.id} />}
        {activeProject && activeTab === "production-deployment" && <ProductionDeployment projectId={activeProject.id} />}

        {!activeProject && activeTab !== "dashboard" && activeTab !== "projects" && activeTab !== "agents" && activeTab !== "reports" && activeTab !== "settings" && (
          <CodeAcquisition onProjectCreated={handleProjectCreated} />
        )}
      </main>
    </div>
  );
}