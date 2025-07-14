import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Bell, Search, User, Settings, HelpCircle, 
  Activity, CheckCircle, AlertTriangle, Clock
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import type { Project } from "@shared/schema";

interface ModernHeaderProps {
  activeProject: Project | null;
  isCollapsed: boolean;
  onNewProject?: () => void;
}

export default function ModernHeader({ activeProject, isCollapsed, onNewProject }: ModernHeaderProps) {
  const [notifications, setNotifications] = useState([
    { id: 1, type: 'success', message: 'Analysis completed for EGOV-RTS-NMC', time: '2 min ago' },
    { id: 2, type: 'info', message: 'New security tests generated', time: '5 min ago' },
    { id: 3, type: 'warning', message: 'Performance threshold exceeded', time: '10 min ago' },
  ]);

  // Fetch current project status if activeProject exists
  const { data: currentProject } = useQuery({
    queryKey: [`/api/projects/${activeProject?.id}`],
    queryFn: async () => {
      const response = await fetch(`/api/projects/${activeProject!.id}`);
      if (!response.ok) throw new Error('Failed to fetch project');
      return response.json();
    },
    enabled: !!activeProject?.id,
    refetchInterval: activeProject?.analysisStatus === 'analyzing' || activeProject?.analysisStatus === 'pending' ? 2000 : false,
  });

  const getStatusDetails = (status: string) => {
    switch (status) {
      case 'completed':
        return { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50', text: 'Analysis Complete' };
      case 'analyzing':
        return { icon: Activity, color: 'text-blue-600', bg: 'bg-blue-50', text: 'Analyzing...' };
      case 'failed':
        return { icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50', text: 'Analysis Failed' };
      case 'pending':
        return { icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-50', text: 'Pending Analysis' };
      default:
        return { icon: Clock, color: 'text-gray-600', bg: 'bg-gray-50', text: 'Unknown Status' };
    }
  };

  const projectToDisplay = currentProject || activeProject;

  return (
    <header className={`fixed top-0 right-0 bg-white border-b border-gray-200 shadow-sm z-40 transition-all duration-300 ${
      isCollapsed ? 'left-16' : 'left-64'
    }`}>
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Project Status */}
          <div className="flex items-center space-x-4">
            {projectToDisplay && (
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  {(() => {
                    const status = getStatusDetails(projectToDisplay.analysisStatus);
                    const StatusIcon = status.icon;
                    return (
                      <>
                        <div className={`p-2 rounded-lg ${status.bg}`}>
                          <StatusIcon className={`w-4 h-4 ${status.color} ${
                            projectToDisplay.analysisStatus === 'analyzing' ? 'animate-pulse' : ''
                          }`} />
                        </div>
                        <div>
                          <h2 className="text-lg font-semibold text-gray-900">
                            {projectToDisplay.name}
                          </h2>
                          <p className="text-sm text-gray-500">{status.text}</p>
                        </div>
                      </>
                    );
                  })()}
                </div>
                <Badge variant="outline" className="text-xs">
                  {projectToDisplay.sourceType}
                </Badge>
              </div>
            )}
            
            {!projectToDisplay && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900">MATT Platform</h2>
                <p className="text-sm text-gray-500">Ready to analyze your code</p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-3">
            {/* New Project Button */}
            {onNewProject && (
              <Button 
                onClick={onNewProject}
                variant="outline"
                size="sm"
              >
                New Project
              </Button>
            )}

            {/* Search */}
            <Button variant="ghost" size="sm" className="relative">
              <Search className="w-4 h-4" />
            </Button>

            {/* Notifications */}
            <Button variant="ghost" size="sm" className="relative">
              <Bell className="w-4 h-4" />
              {notifications.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {notifications.length}
                </span>
              )}
            </Button>

            {/* Help */}
            <Button variant="ghost" size="sm">
              <HelpCircle className="w-4 h-4" />
            </Button>

            {/* Settings */}
            <Button variant="ghost" size="sm">
              <Settings className="w-4 h-4" />
            </Button>

            {/* User Profile */}
            <Button variant="ghost" size="sm" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}