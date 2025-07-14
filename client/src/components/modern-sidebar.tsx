import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Home, Bot, BarChart3, TestTube, Bug, FileText, Rocket, 
  Settings, Menu, X, Activity, Shield, Zap, Monitor, FolderOpen, Brain
} from "lucide-react";
import type { Project } from "@shared/schema";

interface ModernSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  activeProject: Project | null;
  projects: Project[];
  onProjectSelect: (project: Project) => void;
  onNewProject: () => void;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export default function ModernSidebar({ 
  collapsed,
  onToggle,
  activeProject,
  projects,
  onProjectSelect,
  onNewProject,
  activeTab,
  onTabChange
}: ModernSidebarProps) {
  const mainNavItems = [
    { id: "dashboard", label: "Dashboard", icon: Home, color: "text-blue-600" },
    { id: "projects", label: "Projects", icon: FolderOpen, color: "text-indigo-600" },
    { id: "agents", label: "AI Agents", icon: Bot, color: "text-purple-600" },
  ];

  const projectNavItems = activeProject ? [
    { id: "acquisition", label: "Code Acquisition", icon: FileText, color: "text-gray-600" },
    { id: "analysis", label: "Analysis", icon: BarChart3, color: "text-green-600" },
    { id: "test-generation", label: "Test Generation", icon: TestTube, color: "text-orange-600" },
    { id: "ml-insights", label: "ML Intelligence", icon: Brain, color: "text-purple-600" },
    { id: "automated-tests", label: "Automated Tests", icon: Zap, color: "text-purple-600" },
    { id: "test-results", label: "Test Results", icon: Activity, color: "text-blue-600" },
    { id: "logs", label: "Logs", icon: Monitor, color: "text-gray-600" },
    { id: "error-analysis", label: "Error Analysis", icon: Bug, color: "text-red-600" },
    { id: "reports", label: "Reports", icon: FileText, color: "text-indigo-600" },
    { id: "production", label: "Production", icon: Rocket, color: "text-emerald-600" },
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
    <div className={`bg-white border-r border-gray-200 shadow-lg transition-all duration-300 ${
      collapsed ? 'w-16' : 'w-64'
    }`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          {!collapsed && (
            <div>
              <h1 className="text-lg font-bold text-gray-900">MATT Platform</h1>
              <p className="text-xs text-gray-500">Enterprise Testing Suite</p>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggle}
            className="p-2 hover:bg-gray-100"
          >
            {collapsed ? <Menu className="w-4 h-4" /> : <X className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Main Navigation */}
        <div>
          {!collapsed && (
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
                    collapsed ? 'px-2' : 'px-3'
                  } ${isActive ? 'bg-blue-50 text-blue-700 border-blue-200' : 'text-gray-700 hover:bg-gray-50'}`}
                  onClick={() => onTabChange(item.id)}
                >
                  <Icon className={`w-4 h-4 ${collapsed ? '' : 'mr-3'} ${item.color}`} />
                  {!collapsed && <span className="truncate">{item.label}</span>}
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
              collapsed ? 'px-2' : 'px-3'
            }`}
          >
            {!collapsed && <span>New Project</span>}
            {collapsed && <span className="text-lg">+</span>}
          </Button>
        </div>

        {/* Project Navigation */}
        {activeProject && (
          <div>
            {!collapsed && (
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
                      collapsed ? 'px-2' : 'px-3'
                    } ${isActive ? 'bg-blue-50 text-blue-700 border-blue-200' : 'text-gray-600 hover:bg-gray-50'}`}
                    onClick={() => onTabChange(item.id)}
                  >
                    <Icon className={`w-4 h-4 ${collapsed ? '' : 'mr-3'} ${item.color}`} />
                    {!collapsed && <span className="truncate text-sm">{item.label}</span>}
                  </Button>
                );
              })}
            </nav>
          </div>
        )}
      </div>

      {/* Footer */}
      {!collapsed && (
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
