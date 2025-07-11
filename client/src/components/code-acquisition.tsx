import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Github, HardDrive, FileText, Download, Upload, Key, Link, CheckCircle, XCircle, Loader2 } from "lucide-react";
import type { Project, InsertProject } from "@shared/schema";

interface CodeAcquisitionProps {
  onProjectCreated: (project: Project) => void;
}

export default function CodeAcquisition({ onProjectCreated }: CodeAcquisitionProps) {
  const [selectedSource, setSelectedSource] = useState<"github" | "drive" | "jira">("github");
  const [connectionStatus, setConnectionStatus] = useState<{
    drive?: { connected: boolean; testing: boolean; userInfo?: any; error?: string };
    jira?: { connected: boolean; testing: boolean; userInfo?: any; error?: string };
  }>({});
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    sourceUrl: "",
    branch: "main",
    token: "",
    // Google Drive specific
    driveFileId: "",
    driveAccessToken: "",
    // JIRA specific
    jiraProjectKey: "",
    jiraServerUrl: "",
    jiraEmail: "",
    jiraApiToken: "",
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createProjectMutation = useMutation({
    mutationFn: async (data: InsertProject) => {
      const response = await apiRequest("POST", "/api/projects", data);
      return response.json();
    },
    onSuccess: (project: Project) => {
      toast({
        title: "Project Created",
        description: "Repository cloned successfully. Analysis workflow started.",
      });
      onProjectCreated(project);
      queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
      
      // Reset form
      setFormData({
        name: "",
        description: "",
        sourceUrl: "",
        branch: "main",
        token: "",
        driveFileId: "",
        driveAccessToken: "",
        jiraProjectKey: "",
        jiraServerUrl: "",
        jiraEmail: "",
        jiraApiToken: "",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create project. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = () => {
    // Validation based on source type
    if (!formData.name) {
      toast({
        title: "Missing Information",
        description: "Please provide a project name.",
        variant: "destructive",
      });
      return;
    }

    if (selectedSource === "github" && !formData.sourceUrl) {
      toast({
        title: "Missing Information",
        description: "Please provide a GitHub repository URL.",
        variant: "destructive",
      });
      return;
    }

    if (selectedSource === "drive" && (!formData.driveFileId || !formData.driveAccessToken)) {
      toast({
        title: "Missing Information",
        description: "Please provide Google Drive file ID and access token.",
        variant: "destructive",
      });
      return;
    }

    if (selectedSource === "jira" && (!formData.jiraServerUrl || !formData.jiraProjectKey || !formData.jiraEmail || !formData.jiraApiToken)) {
      toast({
        title: "Missing Information",
        description: "Please provide all JIRA connection details.",
        variant: "destructive",
      });
      return;
    }

    const projectData: InsertProject = {
      name: formData.name,
      description: formData.description,
      sourceType: selectedSource,
      sourceUrl: selectedSource === "github" ? formData.sourceUrl : 
                 selectedSource === "drive" ? `https://drive.google.com/file/d/${formData.driveFileId}` :
                 `${formData.jiraServerUrl}/projects/${formData.jiraProjectKey}`,
      repositoryData: {
        ...(selectedSource === "github" && {
          branch: formData.branch,
          token: formData.token || undefined,
        }),
        ...(selectedSource === "drive" && {
          driveFileId: formData.driveFileId,
          driveAccessToken: formData.driveAccessToken,
        }),
        ...(selectedSource === "jira" && {
          jiraServerUrl: formData.jiraServerUrl,
          jiraProjectKey: formData.jiraProjectKey,
          jiraEmail: formData.jiraEmail,
          jiraApiToken: formData.jiraApiToken,
        }),
      },
    };

    createProjectMutation.mutate(projectData);
  };

  const testGoogleDriveConnection = async () => {
    if (!formData.driveAccessToken) {
      toast({
        title: "Missing Token",
        description: "Please provide a Google Drive access token first.",
        variant: "destructive",
      });
      return;
    }

    setConnectionStatus(prev => ({ ...prev, drive: { connected: false, testing: true } }));

    try {
      const response = await apiRequest("POST", "/api/integrations/drive/test", {
        accessToken: formData.driveAccessToken
      });
      const result = await response.json();

      setConnectionStatus(prev => ({ 
        ...prev, 
        drive: { 
          connected: result.connected, 
          testing: false, 
          userInfo: result.userInfo,
          error: result.error 
        } 
      }));

      if (result.connected) {
        toast({
          title: "Connection Successful",
          description: `Connected to Google Drive as ${result.userInfo?.user?.displayName || 'user'}`,
        });
      } else {
        toast({
          title: "Connection Failed",
          description: result.error || "Failed to connect to Google Drive",
          variant: "destructive",
        });
      }
    } catch (error) {
      setConnectionStatus(prev => ({ 
        ...prev, 
        drive: { connected: false, testing: false, error: "Network error" } 
      }));
      toast({
        title: "Connection Error",
        description: "Failed to test Google Drive connection",
        variant: "destructive",
      });
    }
  };

  const testJiraConnection = async () => {
    if (!formData.jiraServerUrl || !formData.jiraEmail || !formData.jiraApiToken) {
      toast({
        title: "Missing Information",
        description: "Please provide all JIRA connection details first.",
        variant: "destructive",
      });
      return;
    }

    setConnectionStatus(prev => ({ ...prev, jira: { connected: false, testing: true } }));

    try {
      const response = await apiRequest("POST", "/api/integrations/jira/test", {
        serverUrl: formData.jiraServerUrl,
        email: formData.jiraEmail,
        apiToken: formData.jiraApiToken
      });
      const result = await response.json();

      setConnectionStatus(prev => ({ 
        ...prev, 
        jira: { 
          connected: result.connected, 
          testing: false, 
          userInfo: result.userInfo,
          error: result.error 
        } 
      }));

      if (result.connected) {
        toast({
          title: "Connection Successful",
          description: `Connected to JIRA as ${result.userInfo?.displayName || 'user'}`,
        });
      } else {
        toast({
          title: "Connection Failed",
          description: result.error || "Failed to connect to JIRA",
          variant: "destructive",
        });
      }
    } catch (error) {
      setConnectionStatus(prev => ({ 
        ...prev, 
        jira: { connected: false, testing: false, error: "Network error" } 
      }));
      toast({
        title: "Connection Error",
        description: "Failed to test JIRA connection",
        variant: "destructive",
      });
    }
  };

  const sourceOptions = [
    {
      id: "github",
      name: "GitHub",
      description: "Repository URL",
      icon: Github,
      color: "border-ibm-blue bg-blue-50",
    },
    {
      id: "drive",
      name: "Google Drive",
      description: "File upload",
      icon: HardDrive,
      color: "border-carbon-gray-20",
    },
    {
      id: "jira",
      name: "JIRA",
      description: "Issue tracker",
      icon: FileText,
      color: "border-carbon-gray-20",
    },
  ];

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-carbon-gray-100">Code Acquisition</h2>
          <Badge className="bg-green-50 text-white">Ready</Badge>
        </div>

        {/* Source Selection */}
        <div className="mb-6">
          <Label className="text-sm font-medium text-carbon-gray-70 mb-3 block">
            Select Source
          </Label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {sourceOptions.map((source) => {
              const Icon = source.icon;
              return (
                <button
                  key={source.id}
                  onClick={() => setSelectedSource(source.id as any)}
                  className={`p-4 border-2 rounded-lg text-center hover:bg-carbon-gray-10 transition-colors ${
                    selectedSource === source.id ? source.color : "border-carbon-gray-20"
                  }`}
                >
                  <Icon className="mx-auto mb-2 text-carbon-gray-70" size={24} />
                  <p className="text-sm font-medium text-carbon-gray-100">{source.name}</p>
                  <p className="text-xs text-carbon-gray-60">{source.description}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Form Fields */}
        <div className="space-y-4">
          {/* Common Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name" className="text-sm font-medium text-carbon-gray-70">
                Project Name
              </Label>
              <Input
                id="name"
                placeholder="My Awesome Project"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor="description" className="text-sm font-medium text-carbon-gray-70">
                Description (Optional)
              </Label>
              <Input
                id="description"
                placeholder="Project description..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="mt-2"
              />
            </div>
          </div>

          {/* GitHub Specific Fields */}
          {selectedSource === "github" && (
            <>
              <div>
                <Label htmlFor="url" className="text-sm font-medium text-carbon-gray-70">
                  <Github className="inline w-4 h-4 mr-1" />
                  GitHub Repository URL
                </Label>
                <Input
                  id="url"
                  placeholder="https://github.com/username/repository"
                  value={formData.sourceUrl}
                  onChange={(e) => setFormData({ ...formData, sourceUrl: e.target.value })}
                  className="mt-2"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-carbon-gray-70">Branch</Label>
                  <Select value={formData.branch} onValueChange={(value) => setFormData({ ...formData, branch: value })}>
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder="Select branch" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="main">main</SelectItem>
                      <SelectItem value="develop">develop</SelectItem>
                      <SelectItem value="staging">staging</SelectItem>
                      <SelectItem value="master">master</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="token" className="text-sm font-medium text-carbon-gray-70">
                    Access Token (Optional)
                  </Label>
                  <Input
                    id="token"
                    type="password"
                    placeholder="ghp_xxxxxxxxxxxx"
                    value={formData.token}
                    onChange={(e) => setFormData({ ...formData, token: e.target.value })}
                    className="mt-2"
                  />
                </div>
              </div>
            </>
          )}

          {/* Google Drive Specific Fields */}
          {selectedSource === "drive" && (
            <>
              <div>
                <Label htmlFor="driveFileId" className="text-sm font-medium text-carbon-gray-70">
                  <HardDrive className="inline w-4 h-4 mr-1" />
                  Google Drive File ID
                </Label>
                <Input
                  id="driveFileId"
                  placeholder="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
                  value={formData.driveFileId}
                  onChange={(e) => setFormData({ ...formData, driveFileId: e.target.value })}
                  className="mt-2"
                />
                <p className="text-xs text-carbon-gray-60 mt-1">
                  Extract from the Drive URL: https://drive.google.com/file/d/[FILE_ID]/view
                </p>
              </div>

              <div>
                <Label htmlFor="driveAccessToken" className="text-sm font-medium text-carbon-gray-70">
                  <Key className="inline w-4 h-4 mr-1" />
                  Google Drive Access Token
                </Label>
                <Input
                  id="driveAccessToken"
                  type="password"
                  placeholder="ya29.a0AfH6SMC..."
                  value={formData.driveAccessToken}
                  onChange={(e) => setFormData({ ...formData, driveAccessToken: e.target.value })}
                  className="mt-2"
                />
                <p className="text-xs text-carbon-gray-60 mt-1">
                  <Link className="inline w-3 h-3 mr-1" />
                  <a href="https://developers.google.com/drive/api/v3/quickstart" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                    Get your Google Drive API credentials
                  </a>
                </p>
              </div>

              {/* Connection Test Button */}
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={testGoogleDriveConnection}
                  disabled={connectionStatus.drive?.testing || !formData.driveAccessToken}
                  className="flex-1"
                >
                  {connectionStatus.drive?.testing ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : connectionStatus.drive?.connected ? (
                    <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                  ) : connectionStatus.drive?.error ? (
                    <XCircle className="w-4 h-4 mr-2 text-red-600" />
                  ) : (
                    <Key className="w-4 h-4 mr-2" />
                  )}
                  {connectionStatus.drive?.testing ? "Testing..." : "Test Connection"}
                </Button>
                
                {connectionStatus.drive?.connected && (
                  <div className="text-xs text-green-600 font-medium">
                    ✓ Connected as {connectionStatus.drive.userInfo?.user?.displayName}
                  </div>
                )}
              </div>
            </>
          )}

          {/* JIRA Specific Fields */}
          {selectedSource === "jira" && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="jiraServerUrl" className="text-sm font-medium text-carbon-gray-70">
                    <FileText className="inline w-4 h-4 mr-1" />
                    JIRA Server URL
                  </Label>
                  <Input
                    id="jiraServerUrl"
                    placeholder="https://company.atlassian.net"
                    value={formData.jiraServerUrl}
                    onChange={(e) => setFormData({ ...formData, jiraServerUrl: e.target.value })}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="jiraProjectKey" className="text-sm font-medium text-carbon-gray-70">
                    Project Key
                  </Label>
                  <Input
                    id="jiraProjectKey"
                    placeholder="PROJ"
                    value={formData.jiraProjectKey}
                    onChange={(e) => setFormData({ ...formData, jiraProjectKey: e.target.value })}
                    className="mt-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="jiraEmail" className="text-sm font-medium text-carbon-gray-70">
                    JIRA Email
                  </Label>
                  <Input
                    id="jiraEmail"
                    type="email"
                    placeholder="user@company.com"
                    value={formData.jiraEmail}
                    onChange={(e) => setFormData({ ...formData, jiraEmail: e.target.value })}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="jiraApiToken" className="text-sm font-medium text-carbon-gray-70">
                    <Key className="inline w-4 h-4 mr-1" />
                    API Token
                  </Label>
                  <Input
                    id="jiraApiToken"
                    type="password"
                    placeholder="ATATT3xFfGF0..."
                    value={formData.jiraApiToken}
                    onChange={(e) => setFormData({ ...formData, jiraApiToken: e.target.value })}
                    className="mt-2"
                  />
                </div>
              </div>
              <p className="text-xs text-carbon-gray-60">
                <Link className="inline w-3 h-3 mr-1" />
                <a href="https://support.atlassian.com/atlassian-account/docs/manage-api-tokens-for-your-atlassian-account/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                  Create JIRA API token
                </a>
              </p>

              {/* Connection Test Button */}
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={testJiraConnection}
                  disabled={connectionStatus.jira?.testing || !formData.jiraServerUrl || !formData.jiraEmail || !formData.jiraApiToken}
                  className="flex-1"
                >
                  {connectionStatus.jira?.testing ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : connectionStatus.jira?.connected ? (
                    <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                  ) : connectionStatus.jira?.error ? (
                    <XCircle className="w-4 h-4 mr-2 text-red-600" />
                  ) : (
                    <Key className="w-4 h-4 mr-2" />
                  )}
                  {connectionStatus.jira?.testing ? "Testing..." : "Test Connection"}
                </Button>
                
                {connectionStatus.jira?.connected && (
                  <div className="text-xs text-green-600 font-medium">
                    ✓ Connected as {connectionStatus.jira.userInfo?.displayName}
                  </div>
                )}
              </div>
            </>
          )}

          <Button
            onClick={handleSubmit}
            disabled={createProjectMutation.isPending}
            className="w-full bg-ibm-blue hover:bg-blue-700"
          >
            {selectedSource === "github" && <Github size={16} className="mr-2" />}
            {selectedSource === "drive" && <Upload size={16} className="mr-2" />}
            {selectedSource === "jira" && <FileText size={16} className="mr-2" />}
            {createProjectMutation.isPending ? 
              `Acquiring from ${selectedSource === "github" ? "GitHub" : selectedSource === "drive" ? "Google Drive" : "JIRA"}...` : 
              `Acquire from ${selectedSource === "github" ? "GitHub" : selectedSource === "drive" ? "Google Drive" : "JIRA"}`
            }
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
