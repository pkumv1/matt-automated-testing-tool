import { useState, useEffect, useRef } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Trash2, ExternalLink, Calendar, GitBranch, Activity, Plus, FolderOpen, Save, Edit, X, Check, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Project } from "@shared/schema";

interface ProjectsManagementProps {
  onProjectSelect: (project: Project) => void;
  activeProject?: Project | null;
  onNewProject?: () => void;
}

export default function ProjectsManagement({ onProjectSelect, activeProject, onNewProject }: ProjectsManagementProps) {
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({ name: "", description: "" });
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: projects = [], isLoading: isQueryLoading, refetch, error } = useQuery<Project[]>({
    queryKey: ['/api/projects'],
    queryFn: () => apiRequest('GET', '/api/projects?lightweight=true').then(res => res.json()),
    refetchInterval: 30000, // Reduced from 10s to 30s to decrease server load
    retry: 3,
    retryDelay: 1000,
    staleTime: 10000, // Cache data for 10 seconds before considering stale
    gcTime: 5 * 60 * 1000, // Keep data in cache for 5 minutes
  });

  // Handle loading state
  useEffect(() => {
    setIsLoading(isQueryLoading);
  }, [isQueryLoading]);

  // Log errors for debugging
  useEffect(() => {
    if (error) {
      console.error("Failed to fetch projects:", error);
      toast({
        title: "Error Loading Projects",
        description: "Failed to load projects. Please refresh the page.",
        variant: "destructive",
      });
    }
  }, [error, toast]);

  // Auto-save functionality
  useEffect(() => {
    if (hasUnsavedChanges && editingId) {
      // Clear existing timeout
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }

      // Set new timeout for auto-save after 3 seconds of inactivity (increased from 2s)
      autoSaveTimeoutRef.current = setTimeout(() => {
        handleSaveProject(editingId);
      }, 3000);
    }

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [editForm, hasUnsavedChanges, editingId]);

  const updateProjectMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<Project> }) => {
      const response = await apiRequest("PATCH", `/api/projects/${id}`, data);
      
      if (!response.ok) {
        throw new Error(`Failed to update project: ${response.statusText}`);
      }
      
      return response.json();
    },
    onSuccess: (updatedProject) => {
      toast({
        title: "Project Updated",
        description: "Your changes have been saved successfully.",
      });
      
      // Update the cache immediately
      queryClient.setQueryData(['/api/projects'], (oldData: Project[] | undefined) => {
        if (!oldData) return [updatedProject];
        return oldData.map(project => 
          project.id === updatedProject.id ? updatedProject : project
        );
      });
      
      // Also invalidate to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
      setHasUnsavedChanges(false);
      setEditingId(null);
    },
    onError: (error) => {
      console.error("Failed to update project:", error);
      toast({
        title: "Error",
        description: "Failed to update project. Please try again.",
        variant: "destructive",
      });
    },
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <Activity className="w-4 h-4 text-green-500" />;
      case 'analyzing':
        return <Activity className="w-4 h-4 text-blue-500 animate-pulse" />;
      case 'failed':
        return <Activity className="w-4 h-4 text-red-500" />;
      default:
        return <Activity className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return "bg-green-100 text-green-800";
      case 'analyzing':
        return "bg-blue-100 text-blue-800";
      case 'failed':
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handleDeleteProject = async (projectId: number, projectName: string) => {
    setDeletingId(projectId);
    
    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast({
          title: "Project Deleted",
          description: `${projectName} has been successfully deleted.`,
        });
        
        // Invalidate queries and update active project if needed
        queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
        
        if (activeProject?.id === projectId) {
          // If the deleted project was active, clear selection
          const remainingProjects = projects.filter(p => p.id !== projectId);
          if (remainingProjects.length > 0) {
            onProjectSelect(remainingProjects[0]);
          }
        }
      } else {
        throw new Error('Failed to delete project');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete project. Please try again.",
        variant: "destructive",
      });
    } finally {
      setDeletingId(null);
    }
  };

  const handleEditProject = (project: Project) => {
    setEditingId(project.id);
    setEditForm({
      name: project.name,
      description: project.description || "",
    });
    setHasUnsavedChanges(false);
  };

  const handleSaveProject = async (projectId: number) => {
    if (!editForm.name.trim()) {
      toast({
        title: "Validation Error",
        description: "Project name is required.",
        variant: "destructive",
      });
      return;
    }

    updateProjectMutation.mutate({
      id: projectId,
      data: {
        name: editForm.name.trim(),
        description: editForm.description.trim(),
      },
    });
  };

  const handleManualSave = (projectId: number) => {
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }
    handleSaveProject(projectId);
  };

  const handleCancelEdit = () => {
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }
    setEditingId(null);
    setEditForm({ name: "", description: "" });
    setHasUnsavedChanges(false);
  };

  const handleInputChange = (field: 'name' | 'description', value: string) => {
    setEditForm(prev => ({ ...prev, [field]: value }));
    setHasUnsavedChanges(true);
  };

  // Removed unnecessary refetch on mount - React Query handles this automatically

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin mr-2" />
            <span>Loading projects...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Project Management</h2>
          <p className="text-gray-600">Manage your MATT testing projects</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="secondary" className="text-sm">
            {projects.length} {projects.length === 1 ? 'Project' : 'Projects'}
          </Badge>
          <Button 
            onClick={() => refetch()}
            variant="outline"
            size="sm"
            disabled={isQueryLoading}
          >
            {isQueryLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              "Refresh"
            )}
          </Button>
          {onNewProject && (
            <Button 
              onClick={onNewProject}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add New Project
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">All Projects</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[600px]">
            <div className="space-y-4">
              {projects.length === 0 ? (
                <div className="text-center py-16">
                  <FolderOpen className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Projects Yet</h3>
                  <p className="text-gray-500 mb-4">Create your first project to start automated code analysis with MATT</p>
                  {onNewProject && (
                    <Button onClick={onNewProject} className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white">
                      <Plus className="w-4 h-4 mr-2" />
                      Create Your First Project
                    </Button>
                  )}
                </div>
              ) : (
                projects.map((project) => (
                  <div
                    key={project.id}
                    className={`border rounded-lg p-4 transition-all hover:shadow-md ${
                      activeProject?.id === project.id ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:bg-gray-50'
                    } ${editingId === project.id ? 'cursor-default' : 'cursor-pointer'}`}
                    onClick={() => editingId !== project.id && onProjectSelect(project)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        {editingId === project.id ? (
                          <>
                            <div className="space-y-3">
                              <Input
                                value={editForm.name}
                                onChange={(e) => handleInputChange('name', e.target.value)}
                                onClick={(e) => e.stopPropagation()}
                                className="font-semibold"
                                placeholder="Project name"
                              />
                              <Textarea
                                value={editForm.description}
                                onChange={(e) => handleInputChange('description', e.target.value)}
                                onClick={(e) => e.stopPropagation()}
                                className="text-sm"
                                placeholder="Project description"
                                rows={2}
                              />
                              {hasUnsavedChanges && (
                                <p className="text-xs text-orange-600">
                                  Auto-saving in 3 seconds...
                                </p>
                              )}
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="flex items-center gap-3 mb-2">
                              {getStatusIcon(project.analysisStatus)}
                              <h3 className="font-semibold text-gray-900">{project.name}</h3>
                              <Badge className={getStatusColor(project.analysisStatus)}>
                                {project.analysisStatus}
                              </Badge>
                            </div>
                            
                            <p className="text-sm text-gray-600 mb-3">
                              {project.description || "No description provided"}
                            </p>
                          </>
                        )}
                        
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <div className="flex items-center gap-1">
                            <GitBranch className="w-3 h-3" />
                            <span className="uppercase font-medium">{project.sourceType}</span>
                          </div>
                          
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            <span>{new Date(project.createdAt).toLocaleDateString()}</span>
                          </div>
                          
                          {project.sourceUrl && (
                            <div className="flex items-center gap-1">
                              <ExternalLink className="w-3 h-3" />
                              <span className="truncate max-w-[200px]">{project.sourceUrl}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 ml-4">
                        {editingId === project.id ? (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleManualSave(project.id);
                              }}
                              disabled={updateProjectMutation.isPending || !hasUnsavedChanges}
                              className="text-green-600 hover:text-green-700"
                            >
                              <Save className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCancelEdit();
                              }}
                              className="text-gray-600 hover:text-gray-700"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditProject(project);
                              }}
                              className="text-gray-600 hover:text-gray-700"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                onProjectSelect(project);
                              }}
                              className="text-blue-600 hover:text-blue-700"
                            >
                              Open
                            </Button>
                          </>
                        )}
                        
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => e.stopPropagation()}
                              disabled={deletingId === project.id}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Project</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete "{project.name}"? This will permanently 
                                remove the project and all associated analysis data, test cases, and results. 
                                This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteProject(project.id, project.name)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Delete Project
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}