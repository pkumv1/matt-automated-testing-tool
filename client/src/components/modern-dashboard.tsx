import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  BarChart3, TestTube, Shield, Zap, Activity, 
  TrendingUp, Users, Clock, CheckCircle, AlertTriangle
} from "lucide-react";
import type { Project } from "@shared/schema";

interface ModernDashboardProps {
  activeProject: Project | null;
  projects: Project[];
  agents: any[];
  testCases: any[];
  onProjectSelect: (project: Project) => void;
  onNewProject: () => void;
  onStartAnalysis: () => void;
}

export default function ModernDashboard({ 
  activeProject,
  projects, 
  agents,
  testCases,
  onProjectSelect, 
  onNewProject,
  onStartAnalysis 
}: ModernDashboardProps) {
  const getProjectStats = () => {
    const total = projects.length;
    const completed = projects.filter(p => p.analysisStatus === 'completed').length;
    const analyzing = projects.filter(p => p.analysisStatus === 'analyzing').length;
    const pending = projects.filter(p => p.analysisStatus === 'pending').length;
    
    return { total, completed, analyzing, pending };
  };

  const stats = getProjectStats();

  const getDashboardMetrics = () => [
    {
      title: "Total Projects",
      value: stats.total.toString(),
      change: "+12%",
      trend: "up",
      icon: BarChart3,
      color: "text-blue-600",
      bg: "bg-blue-50"
    },
    {
      title: "Tests Generated",
      value: testCases.length.toString(),
      change: "+8%",
      trend: "up",
      icon: TestTube,
      color: "text-green-600",
      bg: "bg-green-50"
    },
    {
      title: "Security Issues Found",
      value: "23",
      change: "-15%",
      trend: "down",
      icon: Shield,
      color: "text-red-600",
      bg: "bg-red-50"
    },
    {
      title: "Performance Score",
      value: "94%",
      change: "+3%",
      trend: "up",
      icon: Zap,
      color: "text-yellow-600",
      bg: "bg-yellow-50"
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600';
      case 'analyzing': return 'text-blue-600';
      case 'failed': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return CheckCircle;
      case 'analyzing': return Activity;
      case 'failed': return AlertTriangle;
      default: return Clock;
    }
  };

  return (
    <div className="space-y-8 p-8">
      {/* Welcome Section with MATT Graphic */}
      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700 text-white p-8 rounded-2xl relative overflow-hidden">
        <div className="flex items-center justify-between gap-8">
          <div className="flex-1 max-w-2xl z-10 relative">
            <div className="flex items-center mb-4">
              <div className="bg-white/20 p-2 rounded-lg mr-4">
                <TestTube className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">
                  MATT Platform
                </h1>
                <p className="text-blue-100 text-lg">Mars Automated Testing Tool</p>
              </div>
            </div>
            <p className="text-blue-100 text-lg mb-6">
              Leverage intelligent automated agents to analyze your code, assess risks, 
              and generate comprehensive test suites with enterprise-grade deployment readiness.
            </p>
            <div className="flex items-center space-x-4">
              <Button 
                onClick={onNewProject}
                className="bg-white text-blue-600 hover:bg-blue-50 font-semibold"
              >
                Start New Analysis
              </Button>
              <Button 
                variant="outline"
                className="border-white text-white hover:bg-white/10"
              >
                View Documentation
              </Button>
            </div>
          </div>
          
          {/* MATT Automated Testing Visual */}
          <div className="hidden md:block relative flex-shrink-0">
            <div className="w-80 h-56 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 p-6 relative overflow-hidden">
              {/* Fallback Background Pattern */}
              <div className="absolute inset-0 opacity-30">
                <svg width="100%" height="100%" viewBox="0 0 320 224">
                  <defs>
                    <pattern id="techGrid" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
                      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1" opacity="0.3"/>
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#techGrid)"/>
                  
                  {/* Central Hub */}
                  <circle cx="160" cy="112" r="30" fill="white" fillOpacity="0.2" stroke="white" strokeWidth="2"/>
                  <text x="160" y="118" textAnchor="middle" fill="white" fontSize="14" fontWeight="bold">MATT</text>
                  
                  {/* Testing Connections */}
                  <g stroke="white" strokeWidth="2" opacity="0.6">
                    <line x1="160" y1="112" x2="100" y2="60"/>
                    <line x1="160" y1="112" x2="220" y2="60"/>
                    <line x1="160" y1="112" x2="100" y2="164"/>
                    <line x1="160" y1="112" x2="220" y2="164"/>
                  </g>
                  
                  {/* Testing Nodes */}
                  <circle cx="100" cy="60" r="15" fill="white" fillOpacity="0.3"/>
                  <text x="100" y="65" textAnchor="middle" fill="white" fontSize="10">SEC</text>
                  
                  <circle cx="220" cy="60" r="15" fill="white" fillOpacity="0.3"/>
                  <text x="220" y="65" textAnchor="middle" fill="white" fontSize="10">PERF</text>
                  
                  <circle cx="100" cy="164" r="15" fill="white" fillOpacity="0.3"/>
                  <text x="100" y="169" textAnchor="middle" fill="white" fontSize="10">API</text>
                  
                  <circle cx="220" cy="164" r="15" fill="white" fillOpacity="0.3"/>
                  <text x="220" y="169" textAnchor="middle" fill="white" fontSize="10">UI</text>
                </svg>
              </div>
              
              {/* Overlay Content */}
              <div className="relative z-10">
                <div className="flex items-center mb-4">
                  <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center mr-3">
                    <TestTube className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <div className="text-white font-bold text-lg">Intelligent Testing</div>
                    <div className="text-white/80 text-sm">Automated Quality Assurance</div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center text-white/90 text-sm">
                    <Shield className="w-4 h-4 mr-2" />
                    Security Analysis
                  </div>
                  <div className="flex items-center text-white/90 text-sm">
                    <Zap className="w-4 h-4 mr-2" />
                    Performance Testing
                  </div>
                  <div className="flex items-center text-white/90 text-sm">
                    <Activity className="w-4 h-4 mr-2" />
                    Automated Execution
                  </div>
                </div>
              </div>
              
              {/* Animated Pulse Effect */}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <div className="w-16 h-16 border border-white/30 rounded-full animate-ping"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {getDashboardMetrics().map((metric, index) => {
          const Icon = metric.icon;
          return (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-lg ${metric.bg}`}>
                    <Icon className={`w-6 h-6 ${metric.color}`} />
                  </div>
                  <Badge variant={metric.trend === 'up' ? 'default' : 'secondary'}>
                    {metric.change}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">{metric.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{metric.value}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Projects Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Projects */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Recent Projects</span>
                <Button variant="outline" size="sm" onClick={onNewProject}>
                  New Project
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {projects.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <BarChart3 className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Projects Yet</h3>
                  <p className="text-gray-500 mb-4">
                    Create your first project to start automated code analysis with MATT
                  </p>
                  <Button onClick={onNewProject}>
                    Create Project
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {projects.slice(0, 5).map((project) => {
                    const StatusIcon = getStatusIcon(project.analysisStatus);
                    return (
                      <div 
                        key={project.id}
                        className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                        onClick={() => onProjectSelect(project)}
                      >
                        <div className="flex items-center space-x-3">
                          <StatusIcon className={`w-5 h-5 ${getStatusColor(project.analysisStatus)}`} />
                          <div>
                            <h4 className="font-medium text-gray-900">{project.name}</h4>
                            <p className="text-sm text-gray-500">{project.description}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline" className="text-xs">
                            {project.sourceType}
                          </Badge>
                          <Badge 
                            variant={project.analysisStatus === 'completed' ? 'default' : 'secondary'}
                            className="text-xs"
                          >
                            {project.analysisStatus}
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Agent Status */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Activity className="w-5 h-5" />
                <span>AI Agents</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {agents.slice(0, 6).map((agent, index) => (
                  <div key={agent.id || index} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">{agent.name}</p>
                      <p className="text-xs text-gray-500">{agent.type}</p>
                    </div>
                    <Badge 
                      variant={agent.status === 'active' ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {agent.status || 'active'}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full justify-start" onClick={onStartAnalysis}>
                <TestTube className="w-4 h-4 mr-2" />
                Run Demo Analysis
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Shield className="w-4 h-4 mr-2" />
                Security Scan
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <TrendingUp className="w-4 h-4 mr-2" />
                Performance Test
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Project Statistics */}
      {projects.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Project Analysis Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Completed</span>
                  <span>{stats.completed}/{stats.total}</span>
                </div>
                <Progress value={(stats.completed / stats.total) * 100} className="h-2" />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>In Progress</span>
                  <span>{stats.analyzing}/{stats.total}</span>
                </div>
                <Progress value={(stats.analyzing / stats.total) * 100} className="h-2" />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Pending</span>
                  <span>{stats.pending}/{stats.total}</span>
                </div>
                <Progress value={(stats.pending / stats.total) * 100} className="h-2" />
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
