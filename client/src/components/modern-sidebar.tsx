import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Home, Bot, BarChart3, TestTube, Bug, FileText, Rocket, 
  Settings, Menu, X, Activity, Shield, Zap, Monitor, FolderOpen
} from "lucide-react";
import type { Project } from "@shared/schema";

interface ModernSidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  activeProject: Project | null;
  onNewProject: () => void;
}

export default function ModernSidebar({ 
  activeTab, 
  setActiveTab, 
  activeProject, 
  onNewProject 
}: ModernSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const mainNavItems = [
    { id: "dashboard", label: "Dashboard", icon: Home, color: "text-blue-600" },
    { id: "projects", label: "Projects", icon: FileText, color: "text-indigo-600" },
    { id: "agents", label: "AI Agents", icon: Bot, color: "text-purple-600" },
  ];

  const projectNavItems = activeProject ? [
    { id: "analysis", label: "Overview", icon: BarChart3, color: "text-green-600" },
    { id: "test-generation", label: "Test Case Generation", icon: TestTube, color: "text-orange-600" },
    { id: "automated-test-creation", label: "Automated Tests", icon: Zap, color: "text-purple-600" },
    { id: "test-results", label: "Test Results", icon: Activity, color: "text-blue-600" },
    { id: "logs", label: "Logs & Monitor", icon: Monitor, color: "text-gray-600" },
    { id: "errors", label: "Error Analysis", icon: Bug, color: "text-red-600" },
    { id: "production-deployment", label: "Production", icon: Rocket, color: "text-emerald-600" },
    { id: "comprehensive-report", label: "Full Report", icon: FileText, color: "text-indigo-600" },
  ] : [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'analyzing': return 'bg-blue-500 animate-pulse';
      case 'failed': return 'bg-red-500';
      default: return 'bg-yellow-500';
    }
  };

  return (
    <div className={`fixed left-0 top-0 h-full bg-white border-r border-gray-200 shadow-lg transition-all duration-300 z-50 ${
      isCollapsed ? 'w-16' : 'w-64'
    }`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <div>
              <h1 className="text-lg font-bold text-gray-900">MATT Platform</h1>
              <p className="text-xs text-gray-500">Enterprise Testing Suite</p>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-2 hover:bg-gray-100"
          >
            {isCollapsed ? <Menu className="w-4 h-4" /> : <X className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Main Navigation */}
        <div>
          {!isCollapsed && (
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
              Main
            </h3>
          )}
          <nav className="space-y-1">
            {mainNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              
              return (
                <Button
                  key={item.id}
                  variant={isActive ? "default" : "ghost"}
                  className={`w-full justify-start h-10 ${
                    isCollapsed ? 'px-2' : 'px-3'
                  } ${isActive ? 'bg-blue-50 text-blue-700 border-blue-200' : 'text-gray-700 hover:bg-gray-50'}`}
                  onClick={() => setActiveTab(item.id)}
                >
                  <Icon className={`w-4 h-4 ${isCollapsed ? '' : 'mr-3'} ${item.color}`} />
                  {!isCollapsed && <span className="truncate">{item.label}</span>}
                </Button>
              );
            })}
          </nav>
        </div>

        {/* New Project Button */}
        <div>
          <Button
            onClick={onNewProject}
            className={`w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white ${
              isCollapsed ? 'px-2' : 'px-3'
            }`}
          >
            {!isCollapsed && <span>New Project</span>}
            {isCollapsed && <span className="text-lg">+</span>}
          </Button>
        </div>

        {/* Project Navigation */}
        {activeProject && (
          <div>
            {!isCollapsed && (
              <div className="mb-3">
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
                  Project
                </h3>
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center space-x-2 mb-2">
                    <div className={`w-2 h-2 rounded-full ${getStatusColor(activeProject.analysisStatus)}`}></div>
                    <span className="text-sm font-medium text-gray-900 truncate">
                      {activeProject.name}
                    </span>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {activeProject.analysisStatus}
                  </Badge>
                </div>
              </div>
            )}
            
            <nav className="space-y-1">
              {projectNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                
                return (
                  <Button
                    key={item.id}
                    variant={isActive ? "default" : "ghost"}
                    className={`w-full justify-start h-9 ${
                      isCollapsed ? 'px-2' : 'px-3'
                    } ${isActive ? 'bg-blue-50 text-blue-700 border-blue-200' : 'text-gray-600 hover:bg-gray-50'}`}
                    onClick={() => setActiveTab(item.id)}
                  >
                    <Icon className={`w-4 h-4 ${isCollapsed ? '' : 'mr-3'} ${item.color}`} />
                    {!isCollapsed && <span className="truncate text-sm">{item.label}</span>}
                  </Button>
                );
              })}
            </nav>
          </div>
        )}
      </div>

      {/* Footer */}
      {!isCollapsed && (
        <div className="p-4 border-t border-gray-200">
          <div className="text-xs text-gray-500 space-y-1">
            <div className="flex items-center space-x-2">
              <Shield className="w-3 h-3" />
              <span>Enterprise Ready</span>
            </div>
            <div className="flex items-center space-x-2">
              <Zap className="w-3 h-3" />
              <span>AI Powered</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}